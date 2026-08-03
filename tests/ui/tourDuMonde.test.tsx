import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/entities/Match'
import { TourDuMondeConfig } from '@/core/domain/entities/TourDuMonde'
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

    await utilisateur.click(screen.getByRole('button', { name: 'Annuler' }))
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

  it('range les deux modes dans le même historique, chacun avec ses chiffres', async () => {
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
    // Le X01 montre son reste, le Tour du monde son parcours.
    expect(libelles.some((texte) => texte.includes('321'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('1/3'))).toBe(true)
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
  it('propose les deux jeux et masque les règles X01 hors X01', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')

    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    const regles = await screen.findByRole('region', { name: 'Règles' })
    expect(within(regles).getByRole('button', { name: '501' })).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Tour du monde' }))

    // Score de départ et double out n'ont aucun sens ici : ils disparaissent.
    expect(within(regles).queryByRole('button', { name: '501' })).toBeNull()
    expect(within(regles).queryByRole('button', { name: /double out/i })).toBeNull()
    expect(within(regles).getByText(/on part du/i)).toBeInTheDocument()
  })

  it('démarre une partie dans le mode choisi', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    await utilisateur.type(await screen.findByLabelText('Nouveau joueur'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /kevin/i })).toBeInTheDocument())

    await utilisateur.click(screen.getByRole('button', { name: 'Tour du monde' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Cible de Kevin')).toBeInTheDocument()

    const historique = await services.getMatchHistory.execute()
    expect(historique[0]?.mode).toBe('TOUR_DU_MONDE')
  })
})
