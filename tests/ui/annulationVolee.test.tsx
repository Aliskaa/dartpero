import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import type { Announcer } from '@/core/application/ports/driven/Announcer'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { GARDE_APRES_FERMETURE_MS } from '@/ui/hooks/useConfirmationSortie'
import { PAUSE_ANNULATION_MS } from '@/ui/hooks/usePauseAnnulation'
import { fakeDependencies, SettableClock } from '../fakes'
import { flechette, locationCourante, retourTelephone, validerSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

/**
 * Lot `annulation-volee`, à l'écran : la touche « Annuler » retire une
 * fléchette par appui (planche `annulation`, § 1 et 2), et la fléchette qui
 * sort, gagne ou boucle ouvre une boîte *Corriger* / *Valider la sortie*
 * (forme B, § 3) avant toute écriture.
 */

/** Des services à voix écoutée et à horloge réglable. */
const banc = () => {
  const dites: string[] = []
  const announcer: Announcer = {
    say: (annonce) => dites.push(annonce.map((segment) => segment.texte).join('')),
    cancel: () => {},
  }
  const clock = new SettableClock()
  const base = fakeDependencies({ clock })
  const dependencies = { ...base, devices: { ...base.devices, announcer } }
  return { dites, clock, dependencies, services: createServices(dependencies) }
}

const joueurs = async (services: Services, noms = ['Kevin', 'Julien']) => {
  const ids = []
  for (const nom of noms) ids.push((await services.managePlayers.create(nom)).id)
  return ids
}

const x01 = async (services: Services, config = X01Config.create()) =>
  services.startMatch.execute({ playerIds: await joueurs(services), config })

const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)
const actif = (nom: string) => scoreDe(nom).closest('[aria-current]') !== null
const annuler = () => screen.getByRole('button', { name: /^Annuler/ })
const boite = () => screen.queryByRole('dialog')
const historique = async (services: Services, matchId: MatchId) =>
  (await services.getMatchState.execute(matchId)).history.length

describe('La touche Annuler, une fléchette par appui (X01)', () => {
  it('T20·T19·S5 puis trois appuis : 384, 441, 501, Kevin actif, touche grisée', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await x01(services)
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.triple(20), Dart.triple(19), Dart.single(5)],
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('379'))
    expect(actif('Julien')).toBe(true)
    // La touche nomme la fléchette ; le joueur n'est que dans le nom accessible.
    const touche = screen.getByRole('button', { name: 'Annuler S5 de Kevin' })
    expect(touche).toHaveTextContent('Annuler S5')
    expect(touche).not.toHaveTextContent('Kevin')

    await utilisateur.click(touche)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('384'))
    expect(actif('Kevin')).toBe(true)
    expect(screen.getByRole('button', { name: 'Annuler T19 de Kevin' })).toBeEnabled()

    await utilisateur.click(annuler())
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('441'))
    expect(actif('Kevin')).toBe(true)
    expect(screen.getByRole('button', { name: 'Annuler T20 de Kevin' })).toBeEnabled()

    await utilisateur.click(annuler())
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    expect(actif('Kevin')).toBe(true)
    // Plus rien à retirer : libellé neutre, touche grisée.
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(await historique(services, matchId)).toBe(0)
  })

  it('deux joueurs : Julien perd ses fléchettes, la pause protège la volée de Kevin', async () => {
    const utilisateur = userEvent.setup()
    const { services, clock } = banc()
    const matchId = await x01(services)
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.triple(20), Dart.triple(19), Dart.single(5)],
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(actif('Julien')).toBe(true))
    await flechette(utilisateur, '20')
    await flechette(utilisateur, '5', 'Triple')
    expect(screen.getByRole('button', { name: 'Annuler T5 de Julien' })).toBeEnabled()

    await utilisateur.click(annuler())
    await utilisateur.click(annuler())
    // Julien n'a plus de fléchette : un appui réflexe ne défait rien chez Kevin.
    await utilisateur.click(annuler())
    expect(await historique(services, matchId)).toBe(1)
    expect(scoreDe('Kevin')).toHaveTextContent('379')

    clock.regler(clock.now() + PAUSE_ANNULATION_MS)
    await waitFor(() => expect(annuler()).toBeEnabled(), { timeout: 3000 })
    expect(annuler()).toHaveAccessibleName('Annuler S5 de Kevin')
    await utilisateur.click(annuler())
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('384'))
    expect(actif('Kevin')).toBe(true)
  }, 10_000)

  it('un bust défait : la volée se rouvre et n’est plus perdue', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await x01(services, X01Config.create({ startingScore: 50 }))
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.single(20), Dart.single(20), Dart.single(20)],
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(actif('Julien')).toBe(true))
    expect(scoreDe('Kevin')).toHaveTextContent('50')

    await utilisateur.click(annuler())
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('10'))
    expect(actif('Kevin')).toBe(true)
    expect(screen.getByRole('button', { name: 'Annuler S20 de Kevin' })).toBeEnabled()
  })

  it('une manche gagnée défaite : elle n’est plus gagnée', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await x01(services, X01Config.create({ startingScore: 40, legsToWin: 2 }))
    await services.recordVisit.execute({ matchId, darts: [Dart.single(20), Dart.double(10)] })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(screen.getByText('Manche 2')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Annuler D10 de Kevin' })).toBeEnabled()

    await utilisateur.click(annuler())
    await waitFor(() => expect(screen.getByText('Manche 1')).toBeInTheDocument())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(actif('Kevin')).toBe(true)
    // Rouvrir la volée n'ouvre pas la boîte : sans D10, la volée n'est plus une sortie.
    expect(boite()).toBeNull()
  })
})

describe('La boîte de confirmation de la sortie (forme B)', () => {
  const sortieX01 = async () => {
    const outils = banc()
    const matchId = await x01(
      outils.services,
      X01Config.create({ startingScore: 40, legsToWin: 2 }),
    )
    renderWithServices(<App />, { services: outils.services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    return { ...outils, matchId }
  }

  it('X01 : « Kevin sort sur D10 ? », rien d’écrit ni de dit avant de valider', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matchId } = await sortieX01()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')

    const dialogue = await screen.findByRole('dialog', { name: 'Kevin sort sur D10 ?' })
    expect(dialogue).toHaveTextContent('40 → 0. La manche est gagnée dès que vous validez.')
    // Le focus d'ouverture va sur le choix sans conséquence.
    expect(screen.getByRole('button', { name: 'Corriger' })).toHaveFocus()
    expect(await historique(services, matchId)).toBe(0)
    expect(dites).toEqual([])
    // Derrière la boîte, le reste suit déjà la fléchette de sortie.
    expect(scoreDe('Kevin')).toHaveTextContent('0')

    await validerSortie(utilisateur)

    expect(await screen.findByText('Manche !')).toBeInTheDocument()
    expect(await historique(services, matchId)).toBe(1)
    await waitFor(() => expect(dites.length).toBe(1))
    expect(boite()).toBeNull()
    expect(locationCourante().state).toBeNull()
  })

  it('X01 : Corriger retire la fléchette de sortie, la volée reprend', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matchId } = await sortieX01()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await utilisateur.click(await screen.findByRole('button', { name: 'Corriger' }))

    await waitFor(() => expect(boite()).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(actif('Kevin')).toBe(true)
    expect(screen.getByRole('button', { name: 'Annuler S20 de Kevin' })).toBeEnabled()
    expect(await historique(services, matchId)).toBe(0)
    expect(dites).toEqual([])
  })

  it('X01 : chaque manche se confirme, pas seulement la dernière', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId, clock } = await sortieX01()

    await flechette(utilisateur, '20', 'Double')
    await validerSortie(utilisateur)
    await waitFor(() => expect(actif('Julien')).toBe(true))
    // Julien lance après la garde qui suit toute fermeture de la boîte.
    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await flechette(utilisateur, '20', 'Double')

    expect(await screen.findByRole('dialog', { name: 'Julien sort sur D20 ?' })).toBeInTheDocument()
    expect(await historique(services, matchId)).toBe(1)
  })

  it('X01 : un bust n’est jamais confirmé', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await sortieX01()

    await flechette(utilisateur, '20', 'Triple')

    await waitFor(async () => expect(await historique(services, matchId)).toBe(1))
    expect(boite()).toBeNull()
  })

  it('retour du téléphone : comme Corriger, et l’écran reste', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await sortieX01()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await screen.findByRole('dialog')

    await retourTelephone()

    await waitFor(() => expect(boite()).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(await historique(services, matchId)).toBe(0)
  })

  it('Échap (`cancel`) : comme Corriger', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await sortieX01()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    const dialogue = await screen.findByRole('dialog')

    // jsdom ne relaie pas Échap en `cancel` : on envoie l'événement du navigateur.
    act(() => {
      dialogue.dispatchEvent(new Event('cancel', { cancelable: true }))
    })

    await waitFor(() => expect(boite()).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(await historique(services, matchId)).toBe(0)
  })

  it('appui sur le voile : comme Corriger', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await sortieX01()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    const dialogue = await screen.findByRole('dialog')

    // Hors de la boîte (jsdom la mesure à 0 × 0) : l'appui commence et finit sur le voile.
    fireEvent.pointerDown(dialogue, { clientX: 300, clientY: 600 })
    fireEvent.click(dialogue, { clientX: 300, clientY: 600 })

    await waitFor(() => expect(boite()).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(await historique(services, matchId)).toBe(0)
  })

  it('valider la manche qui gagne la partie mène au résumé, sans entrée orpheline', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await x01(services, X01Config.create({ startingScore: 40, legsToWin: 1 }))
    renderWithServices(<App />, {
      services,
      historique: ['/', `/partie/${matchId}`],
    })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await flechette(utilisateur, '20', 'Double')
    await validerSortie(utilisateur)

    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
    expect(locationCourante().pathname).toBe(`/partie/${matchId}/resume`)
    expect(locationCourante().state).toBeNull()
    // Le résumé a remplacé l'écran de partie : un retour ramène à l'accueil.
    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('une entrée héritée d’un rechargement, sans sortie en attente, est dépilée une fois la volée relue', async () => {
    const { services } = banc()
    const matchId = await x01(services)
    renderWithServices(<App />, {
      services,
      historique: [
        `/partie/${matchId}`,
        { pathname: `/partie/${matchId}`, state: { confirmation: 'sortie' } },
      ],
    })

    await waitFor(() => expect(locationCourante().state).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(boite()).toBeNull()
    expect(scoreDe('Kevin')).toHaveTextContent('501')
  })

  it('Cricket : « Kevin gagne sur T20 ? », la victoire après Valider', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services),
      config: CricketConfig.create({ targets: [20] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')

    await flechette(utilisateur, '20', 'Triple')

    const dialogue = await screen.findByRole('dialog', { name: 'Kevin gagne sur T20 ?' })
    expect(dialogue).toHaveTextContent('La partie est gagnée dès que vous validez.')
    expect((await services.playCricket.getState(matchId)).history).toHaveLength(0)
    expect(dites).toEqual([])

    await validerSortie(utilisateur)
    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
  })

  it('Cricket cut-throat : la fléchette de Julien fait gagner Kevin, la boîte nomme Kevin', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const config = CricketConfig.create({ targets: [20, 19], variant: 'CUT_THROAT' })
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services, ['Kevin', 'Julien', 'Marie']),
      config,
    })
    const T20 = Dart.triple(20)
    const T19 = Dart.triple(19)
    const M = Dart.miss()
    // Kevin ferme le 20 ; Marie ferme le 19 et charge Kevin et Julien (57 chacun) ;
    // Kevin ferme le 19 : tout fermé, mais 57 > 0 chez Marie, il ne gagne pas.
    for (const darts of [
      [T20, M, M],
      [M, M, M],
      [T19, T19, M],
      [T19, M, M],
    ]) {
      await services.playCricket.recordVisit(matchId, darts)
    }
    expect((await services.playCricket.getState(matchId)).finished).toBe(false)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() =>
      expect(screen.getByLabelText('Points de Julien').closest('[aria-current]')).not.toBeNull(),
    )
    // Julien ferme le 20, puis charge Marie de 60 : Kevin devient le plus bas.
    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')

    expect(await screen.findByRole('dialog', { name: 'Kevin gagne sur T20 ?' })).toBeInTheDocument()
  })

  it('Tour du monde : la boîte au bouclage, la partie continue', async () => {
    const utilisateur = userEvent.setup()
    const { services, clock } = banc()
    const matchId = await services.playTourDuMonde.start({
      playerIds: await joueurs(services),
      config: TourDuMondeConfig.create({ targets: [20, 'BULL'] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    const dialogue = await screen.findByRole('dialog', {
      name: 'Kevin boucle le parcours sur 25 ?',
    })
    expect(dialogue).toHaveTextContent('La partie continue jusqu’à la fin du tour de table.')
    expect((await services.playTourDuMonde.getState(matchId)).history).toHaveLength(0)

    await validerSortie(utilisateur)
    expect(await screen.findByText('Dernier tour')).toBeInTheDocument()
    // Julien lance après la garde qui suit toute fermeture de la boîte.
    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    // La fin du tour de table, elle, ne se confirme pas.
    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: '1' }))
    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
  })

  it('Entraînement : jamais de boîte, la manche se rouvre fléchette par fléchette', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const [kevin] = await joueurs(services, ['Kevin'])
    if (!kevin) throw new Error('joueur attendu')
    const matchId = await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create({ rounds: 5 }),
    })
    const reste = (await services.playCheckoutPractice.getState(matchId)).current?.target ?? 0
    const route = services.getCheckoutSuggestion.execute({
      remaining: reste,
      dartsLeft: 3,
      config: { doubleOut: true },
    })
    if (!route) throw new Error('route attendue')
    await services.playCheckoutPractice.recordVisit(matchId, route)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    const derniere = route.at(-1)
    if (!derniere) throw new Error('fléchette attendue')
    const touche = await screen.findByRole('button', {
      name: `Annuler ${Dart.label(derniere)} de Kevin`,
    })

    await utilisateur.click(touche)

    await waitFor(async () =>
      expect((await services.playCheckoutPractice.getState(matchId)).roundsPlayed).toBe(0),
    )
    // La sortie rejouée part directement : aucune confirmation à l'entraînement.
    await flechette(
      utilisateur,
      derniere.segment === 'BULL' ? 'Bulle' : String(derniere.segment),
      derniere.multiplier === 'TRIPLE' ? 'Triple' : 'Double',
    )
    await waitFor(async () =>
      expect((await services.playCheckoutPractice.getState(matchId)).roundsWon).toBe(1),
    )
    expect(boite()).toBeNull()
  })
})

describe('La boîte de confirmation — tour de correction (Test → Dev)', () => {
  /**
   * I-1 : sous `StrictMode`, les effets sont rejoués au montage ; une entrée
   * héritée dépilée deux fois ferait quitter l'écran de partie. Depuis le lot
   * `volee-partielle`, ce qui protège ici est que `pret` est faux au montage :
   * la réconciliation n'a lieu qu'au rendu où la volée en cours est relue, que
   * `StrictMode` ne rejoue pas. La ref `reconciliee` n'est pas ce que ce test
   * observe (Q-T3).
   */
  it('StrictMode : une entrée héritée n’est dépilée qu’une fois, l’écran reste', async () => {
    const { services } = banc()
    const matchId = await x01(services)
    renderWithServices(
      <StrictMode>
        <App />
      </StrictMode>,
      {
        services,
        historique: [
          '/',
          `/partie/${matchId}`,
          { pathname: `/partie/${matchId}`, state: { confirmation: 'sortie' } },
        ],
      },
    )

    await waitFor(() => expect(locationCourante().state).toBeNull())
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    // Un seul recul a eu lieu : le retour suivant ramène à l'accueil.
    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  /** C-3 : la sortie en attente bloque le pavé, même si un appui le traverse. */
  it('X01 : aucune fléchette n’est prise tant qu’une sortie attend', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await x01(services, X01Config.create({ startingScore: 40, legsToWin: 2 }))
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await screen.findByRole('dialog')
    // Le pavé est derrière la boîte : on force l'appui pour prouver la garde du hook.
    fireEvent.click(screen.getByRole('button', { name: '1', hidden: true }))

    await utilisateur.click(screen.getByRole('button', { name: 'Corriger' }))
    await waitFor(() => expect(boite()).toBeNull())
    // Seule S20 reste : le 1 n'a jamais été pris.
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(await historique(services, matchId)).toBe(0)
  })

  it('Cricket : aucune fléchette n’est prise tant que la victoire attend', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services),
      config: CricketConfig.create({ targets: [20, 19] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')

    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '19', 'Triple')
    await screen.findByRole('dialog', { name: 'Kevin gagne sur T19 ?' })
    fireEvent.click(screen.getByRole('button', { name: '20', hidden: true }))
    await validerSortie(utilisateur)

    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
    const etat = await services.playCricket.getState(matchId)
    expect(etat.history).toHaveLength(1)
    expect(etat.history[0]?.darts).toHaveLength(2)
  })

  /**
   * C-6 : tant que la boîte est ouverte, le journal est identique en profondeur
   * (événements ET `updatedAt`) ; un double appui sur Valider n'écrit qu'une volée.
   */
  it('journal intact pendant la boîte ; double appui sur Valider : une seule volée', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const matchId = await x01(services, X01Config.create({ startingScore: 40, legsToWin: 2 }))
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    const avant = structuredClone(await dependencies.matches.findById(matchId))

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    const valider = await screen.findByRole('button', { name: 'Valider la sortie' })
    expect(await dependencies.matches.findById(matchId)).toEqual(avant)

    fireEvent.click(valider)
    fireEvent.click(valider)

    expect(await screen.findByText('Manche !')).toBeInTheDocument()
    await waitFor(() => expect(boite()).toBeNull())
    expect(await historique(services, matchId)).toBe(1)
    expect((await dependencies.matches.findById(matchId))?.events).toHaveLength(2)
  })
})

/** C-4 : Corriger et le retour du téléphone, au Cricket et au Tour du monde. */
describe.each([
  {
    nom: 'Cricket',
    demarrer: async (services: Services) =>
      services.playCricket.start({
        playerIds: await joueurs(services),
        config: CricketConfig.create({ targets: [20, 19] }),
      }),
    attendre: () => screen.findByLabelText('Points de Kevin'),
    poser: async (utilisateur: ReturnType<typeof userEvent.setup>) => {
      await flechette(utilisateur, '20', 'Triple')
      await flechette(utilisateur, '19', 'Triple')
    },
    titre: 'Kevin gagne sur T19 ?',
    volees: async (services: Services, id: MatchId) =>
      (await services.playCricket.getState(id)).history.length,
    reste: 'Annuler T20 de Kevin',
  },
  {
    nom: 'Tour du monde',
    demarrer: async (services: Services) =>
      services.playTourDuMonde.start({
        playerIds: await joueurs(services),
        config: TourDuMondeConfig.create({ targets: [20, 19] }),
      }),
    attendre: () => screen.findByLabelText('Cible de Kevin'),
    poser: async (utilisateur: ReturnType<typeof userEvent.setup>) => {
      await flechette(utilisateur, '20')
      await flechette(utilisateur, '19')
    },
    titre: 'Kevin boucle le parcours sur 19 ?',
    volees: async (services: Services, id: MatchId) =>
      (await services.playTourDuMonde.getState(id)).history.length,
    reste: 'Annuler 20 de Kevin',
  },
])('$nom : fermer la boîte sans valider', (mode) => {
  it('Corriger retire la fléchette, la volée reprend', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const id = await mode.demarrer(services)
    renderWithServices(<App />, { services, route: `/partie/${id}` })
    await mode.attendre()

    await mode.poser(utilisateur)
    await screen.findByRole('dialog', { name: mode.titre })
    await utilisateur.click(screen.getByRole('button', { name: 'Corriger' }))

    await waitFor(() => expect(boite()).toBeNull())
    expect(screen.getByRole('button', { name: mode.reste })).toBeEnabled()
    expect(await mode.volees(services, id)).toBe(0)
  })

  it('le retour du téléphone vaut Corriger, et l’écran reste', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const id = await mode.demarrer(services)
    renderWithServices(<App />, { services, route: `/partie/${id}` })
    await mode.attendre()

    await mode.poser(utilisateur)
    await screen.findByRole('dialog', { name: mode.titre })
    await retourTelephone()

    await waitFor(() => expect(boite()).toBeNull())
    expect(screen.getByRole('button', { name: mode.reste })).toBeEnabled()
    expect(locationCourante().pathname).toBe(`/partie/${id}`)
    expect(await mode.volees(services, id)).toBe(0)
  })

  it('appui fantôme : juste après Corriger, le pavé ignore l’appui ; après le délai, il le prend', async () => {
    const utilisateur = userEvent.setup()
    const { services, clock } = banc()
    const id = await mode.demarrer(services)
    renderWithServices(<App />, { services, route: `/partie/${id}` })
    await mode.attendre()

    await mode.poser(utilisateur)
    await utilisateur.click(await screen.findByRole('button', { name: 'Corriger' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))

    await waitFor(() => expect(boite()).toBeNull())
    expect(screen.getByRole('button', { name: mode.reste })).toBeEnabled()

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))
    expect(screen.getByRole('button', { name: 'Annuler 0 de Kevin' })).toBeEnabled()
    expect(await mode.volees(services, id)).toBe(0)
  })
})

/**
 * Relecture à l'écran, boucle 3 (R3) : un double appui sur *Corriger* posait une
 * fléchette sur le pavé que la boîte venait de découvrir.
 */
describe('Appui fantôme après Corriger (X01)', () => {
  const sortie = async () => {
    const outils = banc()
    const matchId = await x01(
      outils.services,
      X01Config.create({ startingScore: 40, legsToWin: 2 }),
    )
    renderWithServices(<App />, { services: outils.services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    return { ...outils, matchId }
  }

  it('double appui sur Corriger : le second, tombé sur le pavé, n’ajoute rien', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId, clock } = await sortie()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await utilisateur.click(await screen.findByRole('button', { name: 'Corriger' }))
    // Le second appui du double tap : la boîte n'est plus là, c'est le 2 du pavé.
    await utilisateur.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => expect(boite()).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('20')
    expect(screen.getByRole('button', { name: 'Annuler S20 de Kevin' })).toBeEnabled()
    expect(await historique(services, matchId)).toBe(0)

    // Juste avant la fin du délai : toujours ignoré.
    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS - 1)
    await utilisateur.click(screen.getByRole('button', { name: '2' }))
    expect(scoreDe('Kevin')).toHaveTextContent('20')

    // Le délai passé (horloge des services), la fléchette est prise.
    clock.regler(clock.now() + 1)
    await utilisateur.click(screen.getByRole('button', { name: '2' }))
    expect(scoreDe('Kevin')).toHaveTextContent('18')
    expect(screen.getByRole('button', { name: 'Annuler S2 de Kevin' })).toBeEnabled()
  })

  it('le retour du téléphone arme la même garde', async () => {
    const utilisateur = userEvent.setup()
    const { clock } = await sortie()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await screen.findByRole('dialog')
    await retourTelephone()
    await waitFor(() => expect(boite()).toBeNull())
    await utilisateur.click(screen.getByRole('button', { name: '2' }))
    expect(scoreDe('Kevin')).toHaveTextContent('20')

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await utilisateur.click(screen.getByRole('button', { name: '2' }))
    expect(scoreDe('Kevin')).toHaveTextContent('18')
  })

  /**
   * Revue, 2e passe (boucle 4) : un double appui sur *Valider* posait une
   * fléchette fantôme au joueur suivant. La garde vaut aussi après *Valider*.
   */
  it('Valider arme la garde : le double appui ne pose rien au joueur suivant', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId, clock } = await sortie()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '10', 'Double')
    await validerSortie(utilisateur)
    await waitFor(() => expect(actif('Julien')).toBe(true))
    expect(await screen.findByText('Manche !')).toBeInTheDocument()

    // Même instant de l'horloge : le second appui (et un troisième) tombe sur le pavé.
    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    expect(scoreDe('Julien')).toHaveTextContent('40')
    expect(screen.getByRole('button', { name: 'Annuler D10 de Kevin' })).toBeEnabled()

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS - 1)
    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    expect(scoreDe('Julien')).toHaveTextContent('40')

    clock.regler(clock.now() + 1)
    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    expect(scoreDe('Julien')).toHaveTextContent('39')
    expect(await historique(services, matchId)).toBe(1)
  })

  /**
   * Au Tour du monde, la partie continue après le bouclage : même garde pour le
   * joueur suivant. (Au Cricket, la fléchette confirmée gagne la partie : l'écran
   * est terminé, `termine` refuse déjà tout appui — pas de scénario.)
   */
  it('Tour du monde : après Valider le bouclage, l’appui immédiat de Julien est ignoré', async () => {
    const utilisateur = userEvent.setup()
    const { services, clock } = banc()
    const matchId = await services.playTourDuMonde.start({
      playerIds: await joueurs(services),
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '19')
    await validerSortie(utilisateur)
    await waitFor(() =>
      expect(screen.getByLabelText('Cible de Julien').closest('[aria-current]')).not.toBeNull(),
    )

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(screen.getByRole('button', { name: 'Annuler 19 de Kevin' })).toBeEnabled()

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(screen.getByRole('button', { name: 'Annuler 20 de Julien' })).toBeEnabled()
  })
})
