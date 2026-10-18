import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import type { Announcer } from '@/core/application/ports/driven/Announcer'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { CLE_VOIX } from '@/ui/hooks/useAppareil'
import { GARDE_APRES_FERMETURE_MS } from '@/ui/hooks/useConfirmationSortie'
import { PHRASE_VICTOIRE, phraseVictoire } from '@/ui/labels'
import { fakeDependencies, SettableClock } from '../fakes'
import { flechette, validerSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

/**
 * Lot `phrases-victoire` : la voix dit la phrase du résumé, dans le même énoncé
 * que le résultat, à la victoire et après *Valider la sortie* seulement.
 */

const banc = () => {
  const dites: string[] = []
  const announcer: Announcer = {
    say: (annonce) => dites.push(annonce.map((segment) => segment.texte).join('')),
    cancel: () => {},
  }
  const clock = new SettableClock()
  const base = fakeDependencies({ clock })
  const dependencies = { ...base, devices: { ...base.devices, announcer } }
  return { dites, clock, services: createServices(dependencies) }
}

const joueurs = async (services: Services, noms = ['Kevin', 'Julien']) => {
  const ids = []
  for (const nom of noms) ids.push((await services.managePlayers.create(nom)).id)
  return ids
}

const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)
const contientPhrase = (dites: readonly string[]) =>
  dites.some((dite) => PHRASE_VICTOIRE.some((phrase) => dite.includes(phrase)))

describe('Les neuf phrases de victoire', () => {
  it('il y en a neuf, distinctes, et le tirage est stable pour une même partie', () => {
    expect(PHRASE_VICTOIRE).toHaveLength(9)
    expect(new Set(PHRASE_VICTOIRE).size).toBe(9)
    expect(phraseVictoire('match-1')).toBe(phraseVictoire('match-1'))
  })

  it('chaque phrase peut sortir (le tirage couvre les neuf)', () => {
    const tirees = new Set<string>()
    for (let i = 0; i < 500; i += 1) tirees.add(phraseVictoire(`partie-${i}`))
    expect(tirees.size).toBe(9)
  })
})

describe('X01 : la phrase à la victoire du match seulement', () => {
  const partie = async (config: X01Config) => {
    const outils = banc()
    const matchId = await outils.services.startMatch.execute({
      playerIds: await joueurs(outils.services),
      config,
    })
    renderWithServices(<App />, { services: outils.services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    return { ...outils, matchId }
  }

  it('victoire du match : « Checkout », puis la phrase, un seul énoncé, après Valider', async () => {
    const utilisateur = userEvent.setup()
    const { dites, matchId } = await partie(X01Config.create({ startingScore: 40, legsToWin: 1 }))

    await flechette(utilisateur, '20', 'Double')
    await screen.findByRole('dialog')
    expect(dites).toEqual([])

    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    const phrase = phraseVictoire(matchId)
    expect(dites).toEqual([`Checkout. ${phrase}`])
    // Le résumé affiche la même phrase.
    expect(await screen.findByText(phrase)).toBeInTheDocument()
  })

  it('manche intermédiaire : « Checkout » puis le tour, sans phrase', async () => {
    const utilisateur = userEvent.setup()
    const { dites } = await partie(X01Config.create({ startingScore: 40, legsToWin: 2 }))

    await flechette(utilisateur, '20', 'Double')
    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toMatch(/^Checkout\. À toi, /)
    expect(contientPhrase(dites)).toBe(false)
  })

  it('set intermédiaire (deux sets) : pas de phrase non plus', async () => {
    const utilisateur = userEvent.setup()
    const { dites } = await partie(
      X01Config.create({ startingScore: 40, legsToWin: 1, setsToWin: 2 }),
    )

    await flechette(utilisateur, '20', 'Double')
    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(contientPhrase(dites)).toBe(false)
  })

  it('bust : « Bust » et le tour, jamais de phrase', async () => {
    const utilisateur = userEvent.setup()
    const { dites } = await partie(X01Config.create({ startingScore: 40, legsToWin: 1 }))

    await flechette(utilisateur, '20', 'Triple')

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toMatch(/^Bust\. À toi, /)
    expect(contientPhrase(dites)).toBe(false)
  })
})

describe('Cricket : la phrase à la fléchette qui gagne', () => {
  it('victoire : « Partie gagnée ! » puis la phrase, après Valider seulement', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services),
      config: CricketConfig.create({ targets: [20] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')

    await flechette(utilisateur, '20', 'Triple')
    await screen.findByRole('dialog')
    expect(dites).toEqual([])

    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    const phrase = phraseVictoire(matchId)
    expect(dites).toEqual([`Partie gagnée !. ${phrase}`])
    expect(await screen.findByText(phrase)).toBeInTheDocument()
  })

  it('cut-throat : la fléchette de Julien fait gagner Kevin, la phrase est dite', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services, ['Kevin', 'Julien', 'Marie']),
      config: CricketConfig.create({ targets: [20, 19], variant: 'CUT_THROAT' }),
    })
    const T20 = Dart.triple(20)
    const T19 = Dart.triple(19)
    const M = Dart.miss()
    for (const darts of [
      [T20, M, M],
      [M, M, M],
      [T19, T19, M],
      [T19, M, M],
    ]) {
      await services.playCricket.recordVisit(matchId, darts)
    }
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() =>
      expect(screen.getByLabelText('Points de Julien').closest('[aria-current]')).not.toBeNull(),
    )

    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')
    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toBe(`Partie gagnée !. ${phraseVictoire(matchId)}`)
  })

  it('volée qui ne gagne pas : pas de phrase', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services),
      config: CricketConfig.create({ targets: [20, 19] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')

    for (const _ of [0, 1, 2]) await flechette(utilisateur, '20')

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(contientPhrase(dites)).toBe(false)
  })
})

describe('Tour du monde : la phrase suit la fin de partie', () => {
  const partie = async () => {
    const outils = banc()
    const matchId = await outils.services.playTourDuMonde.start({
      playerIds: await joueurs(outils.services),
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    renderWithServices(<App />, { services: outils.services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')
    return { ...outils, matchId }
  }

  it('la fléchette qui boucle garde « Tour bouclé ! » sans phrase ; la fin du tour de table la dit', async () => {
    const utilisateur = userEvent.setup()
    const { dites, matchId, services, clock } = await partie()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '19')
    await validerSortie(utilisateur)
    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toMatch(/^Tour bouclé !\. À toi, /)
    expect(contientPhrase(dites)).toBe(false)

    // Julien ne boucle pas : le tour de table est fini, Kevin gagne.
    await screen.findByText('Dernier tour')
    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    for (const _ of [0, 1, 2]) await flechette(utilisateur, 'Hors')

    await waitFor(() => expect(dites).toHaveLength(2))
    expect(dites[1]).toBe(phraseVictoire(matchId))
    expect((await services.playTourDuMonde.getState(matchId)).finished).toBe(true)
  })

  it('le dernier du tour de table qui boucle et gagne : « Tour bouclé ! » puis la phrase', async () => {
    const outils = banc()
    const { services, dites } = outils
    const [kevin, julien] = await joueurs(services)
    if (!kevin || !julien) throw new Error('joueurs attendus')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin, julien],
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    // Kevin boucle en 3 fléchettes (20, raté, 19) : sa volée est écrite avant l'écran.
    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.miss(),
      Dart.single(19),
    ])
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Julien')

    // Julien boucle en 2 fléchettes : il gagne, et la partie s'arrête là.
    await flechette(userEvent.setup(), '20')
    await flechette(userEvent.setup(), '19')
    await validerSortie(userEvent.setup())

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites).toEqual([`Tour bouclé !. ${phraseVictoire(matchId)}`])
  })

  it('match nul : « Tour bouclé ! » mais jamais de phrase', async () => {
    const { services, dites } = banc()
    const [kevin, julien] = await joueurs(services)
    if (!kevin || !julien) throw new Error('joueurs attendus')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin, julien],
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    await services.playTourDuMonde.recordVisit(matchId, [Dart.single(20), Dart.single(19)])
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Julien')

    const utilisateur = userEvent.setup()
    await flechette(utilisateur, '20')
    await flechette(utilisateur, '19')
    await validerSortie(utilisateur)

    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toBe('Tour bouclé !')
    expect(contientPhrase(dites)).toBe(false)
    expect((await services.playTourDuMonde.getState(matchId)).finished).toBe(true)
  })

  it('le résumé affiche la phrase de la partie, la même que la voix', async () => {
    const { services, dites } = banc()
    const [kevin, julien] = await joueurs(services)
    if (!kevin || !julien) throw new Error('joueurs attendus')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin, julien],
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.miss(),
      Dart.single(19),
    ])
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Julien')

    const utilisateur = userEvent.setup()
    await flechette(utilisateur, '20')
    await flechette(utilisateur, '19')
    await validerSortie(utilisateur)

    expect(await screen.findByText(phraseVictoire(matchId))).toBeInTheDocument()
    await waitFor(() => expect(dites).toHaveLength(1))
    expect(dites[0]).toContain(phraseVictoire(matchId))
  })
})

describe('Voix coupée : rien n’est dit, le résumé garde sa phrase', () => {
  const couper = (services: Services) => services.devices.preferences.write(CLE_VOIX, false)

  it('X01 : victoire du match muette, phrase au résumé', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    couper(services)
    const matchId = await services.startMatch.execute({
      playerIds: await joueurs(services),
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await flechette(utilisateur, '20', 'Double')
    await validerSortie(utilisateur)

    expect(await screen.findByText(phraseVictoire(matchId))).toBeInTheDocument()
    expect(dites).toEqual([])
  })

  it('Cricket : victoire muette', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    couper(services)
    const matchId = await services.playCricket.start({
      playerIds: await joueurs(services),
      config: CricketConfig.create({ targets: [20] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')

    await flechette(utilisateur, '20', 'Triple')
    await validerSortie(utilisateur)

    expect(await screen.findByText(phraseVictoire(matchId))).toBeInTheDocument()
    expect(dites).toEqual([])
  })

  it('Tour du monde : victoire muette', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    couper(services)
    const [kevin, julien] = await joueurs(services)
    if (!kevin || !julien) throw new Error('joueurs attendus')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin, julien],
      config: TourDuMondeConfig.create({ targets: [20, 19] }),
    })
    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.miss(),
      Dart.single(19),
    ])
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Julien')

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '19')
    await validerSortie(utilisateur)

    expect(await screen.findByText(phraseVictoire(matchId))).toBeInTheDocument()
    expect(dites).toEqual([])
  })
})

describe('Annulation : Corriger ne dit rien', () => {
  it('X01 : la fléchette de sortie ouvre la boîte, Corriger reste muet', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const matchId = await services.startMatch.execute({
      playerIds: await joueurs(services),
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await flechette(utilisateur, '20', 'Double')
    await utilisateur.click(await screen.findByRole('button', { name: 'Corriger' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(dites).toEqual([])
  })
})

describe('Entraînement : jamais de phrase', () => {
  it('un checkout réussi à l’entraînement ne dit que « Checkout »', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
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
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByRole('button', { name: 'Annuler' })

    for (const dart of route) {
      await flechette(
        utilisateur,
        dart.segment === 'BULL' ? 'Bulle' : String(dart.segment),
        dart.multiplier === 'TRIPLE'
          ? 'Triple'
          : dart.multiplier === 'DOUBLE'
            ? 'Double'
            : undefined,
      )
    }

    await waitFor(async () =>
      expect((await services.playCheckoutPractice.getState(matchId)).roundsWon).toBe(1),
    )
    expect(dites).toEqual(['Checkout'])
    expect(contientPhrase(dites)).toBe(false)
  })
})
