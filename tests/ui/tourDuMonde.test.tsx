import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

/** Un parcours court, pour que le test tienne en quelques clics : 20, 19, bulle. */
const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })

const partieCourte = async (services: Services, noms = ['Kevin', 'Julien']) => {
  const joueurs = []
  for (const nom of noms) joueurs.push(await services.managePlayers.create(nom))

  const matchId = await services.playTourDuMonde.start({
    playerIds: joueurs.map((joueur) => joueur.id),
    config: COURT,
  })
  return { joueurs, matchId }
}

const cibleDe = (nom: string) => screen.getByLabelText(`Cible de ${nom}`)

/** La ligne entière d'un joueur, pour y lire son compteur de fléchettes. */
const ligneDe = (nom: string): HTMLElement => {
  const ligne = cibleDe(nom).closest('article')
  if (!ligne) throw new Error(`Ligne introuvable pour ${nom}`)
  return ligne
}

/** Une volée blanche : trois fléchettes consommées, aucune cible validée. */
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Tour du monde — écran de jeu', () => {
  it('avance de cible en cible et suit la progression avant l’enregistrement', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    // Le tableau réagit dès la première fléchette, sans attendre la fin de volée.
    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(cibleDe('Kevin')).toHaveTextContent('19')

    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    expect(cibleDe('Kevin')).toHaveTextContent('Bulle')
  })

  it('ne valide pas une cible qu’on n’a pas touchée', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    expect(cibleDe('Kevin')).toHaveTextContent('20')
  })

  it('retire la dernière fléchette saisie quand on annule', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(cibleDe('Kevin')).toHaveTextContent('19')

    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))
  })

  it('passe la main après trois fléchettes', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: '1' }))

    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

  /** La règle qui distingue ce mode : on ne coupe pas la partie au milieu du tour. */
  it('annonce le dernier tour quand quelqu’un boucle, puis conclut', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    // Kevin boucle du premier coup : 20, 19, bulle.
    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    // La partie n'est pas finie : Julien a droit à sa volée.
    expect(await screen.findByText('Dernier tour')).toBeInTheDocument()

    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: '1' }))

    // L'écran de résumé arrive tout seul.
    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kevin' })).toBeInTheDocument()
    expect(screen.getByText(/bouclé en 3 fléchettes/i)).toBeInTheDocument()
  })

  it('affiche un ex æquo plutôt qu’un vainqueur arbitraire', async () => {
    const { services } = fakeServices()
    const { joueurs, matchId } = await partieCourte(services)
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]

    for (const _ of joueurs) await services.playTourDuMonde.recordVisit(matchId, bouclage)

    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    expect(await screen.findByRole('heading', { name: 'Ex æquo' })).toBeInTheDocument()
    expect(screen.queryByText('Vainqueur')).toBeNull()
  })

  /**
   * LE cas du lot : la volée s’arrête sur la fléchette qui boucle le parcours,
   * comme une volée de checkout au X01 — sans réclamer deux fléchettes fantômes.
   *
   * Le montage amène Kevin sur la bulle en un tour de table complet, pour que la
   * main lui revienne : un seul clic doit alors suffire à clore sa volée. C’est
   * ce cas, et lui seul, qui distingue `targetIndexAfter` d’un `state.finished`
   * recopié du Cricket — ici la partie continue, mais la volée est finie.
   */
  it('clôt la volée dès la première fléchette quand c’est elle qui boucle', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    // Kevin touche 20 puis 19 ; le miss consomme sa 3ᵉ fléchette sans boucler.
    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.single(19),
      Dart.miss(),
    ])
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))

    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    // Un seul clic, et la main est déjà passée.
    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')

    // « On finit le tour de table » : boucler n’arrête pas la partie.
    expect(await screen.findByText('Dernier tour')).toBeInTheDocument()
    expect(screen.queryByText('Vainqueur')).toBeNull()
  })

  it('clôt la volée sur la deuxième fléchette quand c’est elle qui boucle', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    await services.playTourDuMonde.recordVisit(matchId, [Dart.single(20), Dart.miss(), Dart.miss()])
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('19'))

    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    // Deux clics, pas trois.
    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

  /**
   * Le compteur départage le mode : il ne doit compter que les fléchettes
   * réellement lancées. Trois fantômes de plus, et le classement ment.
   */
  it('compte les fléchettes réellement lancées après une clôture anticipée', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.single(19),
      Dart.miss(),
    ])
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))

    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    // 3 au premier tour + celle qui boucle. Jamais 6.
    await waitFor(() => expect(ligneDe('Kevin')).toHaveTextContent('4 fléchettes'))

    // Le chiffre n'est juste que parce que la volée est CLOSE : sans clôture
    // anticipée, il compterait une volée encore en cours et serait un hasard.
    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')

    // Et c'est bien ce qui est enregistré, pas seulement ce qui s'affiche.
    const etat = await services.playTourDuMonde.getState(matchId)
    expect(etat.players[0]?.dartsThrown).toBe(4)
    expect(etat.players[0]?.finishedInDarts).toBe(4)
  })

  /** À trois joueurs, un décalage d’un tour se verrait tout de suite. */
  it('rend la main au joueur suivant, et à lui seul, à trois joueurs', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services, ['Kevin', 'Julien', 'Marie'])

    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.single(19),
      Dart.miss(),
    ])
    await services.playTourDuMonde.recordVisit(matchId, RATE)
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))

    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
    expect(ligneDe('Marie')).not.toHaveAttribute('aria-current')
    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')
    expect(screen.queryByText('Vainqueur')).toBeNull()
  })

  /**
   * Le bouton d’annulation ne change pas de code, mais bien de comportement :
   * après un bouclage anticipé, il n’y a plus de fléchette en cours à retirer.
   */
  it('bascule le bouton d’annulation sur la volée dès le bouclage', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.single(19),
      Dart.miss(),
    ])
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))

    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    expect(
      await screen.findByRole('button', { name: 'Annuler la volée de Kevin' }),
    ).toBeInTheDocument()
  })

  /**
   * Le pendant à l’écran : ce que le bouton défait, c’est bien la volée d’une
   * seule fléchette, et l’écran remonté depuis le journal dit la même chose.
   */
  it('annule la volée close sur la première fléchette, et le rejeu confirme', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    await services.playTourDuMonde.recordVisit(matchId, [
      Dart.single(20),
      Dart.single(19),
      Dart.miss(),
    ])
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    const vue = renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))

    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))
    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Annuler la volée de Kevin' }),
    )

    // Kevin retrouve sa bulle, ses 3 fléchettes, et la main.
    await waitFor(() => expect(cibleDe('Kevin').closest('[aria-current]')).not.toBeNull())
    expect(cibleDe('Kevin')).toHaveTextContent('Bulle')
    expect(ligneDe('Kevin')).toHaveTextContent('3 fléchettes')
    expect(screen.queryByText('Dernier tour')).toBeNull()

    // Rejeu à froid : on remonte l’écran, tout revient du journal.
    vue.unmount()
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('Bulle'))
    expect(ligneDe('Kevin')).toHaveTextContent('3 fléchettes')
    expect(cibleDe('Kevin').closest('[aria-current]')).not.toBeNull()
  })
})

describe('Couture GameMode — côté écrans', () => {
  it('mène la même URL vers l’écran du bon mode', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')

    const x01 = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })
    const tour = await services.playTourDuMonde.start({
      playerIds: [kevin.id],
      config: COURT,
    })

    const premier = renderWithServices(<App />, { services, route: `/partie/${x01}` })
    expect(await screen.findByLabelText('Score restant de Kevin')).toBeInTheDocument()
    premier.unmount()

    renderWithServices(<App />, { services, route: `/partie/${tour}` })
    expect(await screen.findByLabelText('Cible de Kevin')).toBeInTheDocument()
    expect(screen.queryByLabelText('Score restant de Kevin')).toBeNull()
  })

  it('range les deux modes dans le même historique, chacun avec son statut', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')

    const x01 = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })
    await services.recordVisit.execute({
      matchId: x01,
      darts: [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
    })

    const tour = await services.playTourDuMonde.start({ playerIds: [kevin.id], config: COURT })
    await services.playTourDuMonde.recordVisit(tour, [Dart.single(20)])

    renderWithServices(<App />, { services, route: '/historique' })

    const parties = await screen.findAllByRole('listitem')
    const libelles = parties.map((partie) => partie.textContent ?? '')

    expect(libelles.some((texte) => texte.includes('Tour du monde'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('X01'))).toBe(true)
    // Le X01 montre ses manches jouées, le Tour du monde « En cours ».
    expect(libelles.some((texte) => texte.includes('0 manche jouée'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('En cours'))).toBe(true)
  })

  it('laisse les statistiques de carrière au X01', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')

    // Une seule partie, en Tour du monde : rien à cumuler côté moyennes.
    const tour = await services.playTourDuMonde.start({ playerIds: [kevin.id], config: COURT })
    await services.playTourDuMonde.recordVisit(tour, [Dart.single(20)])

    expect(await services.getPlayerStats.execute()).toEqual([])

    renderWithServices(<App />, { services, route: '/statistiques' })
    expect(await screen.findByText(/aucune partie au compteur/i)).toBeInTheDocument()
  })
})

describe('Création de partie', () => {
  it('n’a rien à régler : ni score de départ ni double out', async () => {
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')

    renderWithServices(<App />, { services, route: '/nouvelle-partie/tour-du-monde' })

    // Score de départ et double out n'ont aucun sens ici : ils n'y sont pas.
    const regles = await screen.findByRole('region', { name: 'Réglages' })
    expect(within(regles).queryByRole('button', { name: '501' })).toBeNull()
    expect(within(regles).queryByRole('button', { name: /double out/i })).toBeNull()
    expect(within(regles).getByText(/on part du/i)).toBeInTheDocument()
  })

  it('démarre une partie dans le mode choisi', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    await utilisateur.click(await screen.findByRole('link', { name: /^Tour du monde/ }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Nouveau joueur' }))
    await utilisateur.type(screen.getByLabelText('Pseudo'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))
    await waitFor(() => expect(screen.getByText('1/4')).toBeInTheDocument())

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Cible de Kevin')).toBeInTheDocument()

    const historique = await services.getMatchHistory.execute()
    expect(historique[0]?.mode).toBe('TOUR_DU_MONDE')
  })
})
