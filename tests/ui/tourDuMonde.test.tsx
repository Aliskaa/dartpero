import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { fakeServices } from '../fakes'
import { validerSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

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

const ligneDe = (nom: string): HTMLElement => {
  const ligne = cibleDe(nom).closest('article')
  if (!ligne) throw new Error(`Ligne introuvable pour ${nom}`)
  return ligne
}

const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Tour du monde — écran de jeu', () => {
  it('avance de cible en cible et suit la progression avant l’enregistrement', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

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

  it('annonce le dernier tour quand quelqu’un boucle, puis conclut', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(cibleDe('Kevin')).toHaveTextContent('20'))

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))
    await validerSortie(utilisateur)

    expect(await screen.findByText('Dernier tour')).toBeInTheDocument()

    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: '1' }))

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

  it('clôt la volée dès la première fléchette quand c’est elle qui boucle', async () => {
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
    await validerSortie(utilisateur)

    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')

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
    await validerSortie(utilisateur)

    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

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
    await validerSortie(utilisateur)

    await waitFor(() => expect(ligneDe('Kevin')).toHaveTextContent('4 fléchettes'))

    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')

    const etat = await services.playTourDuMonde.getState(matchId)
    expect(etat.players[0]?.dartsThrown).toBe(4)
    expect(etat.players[0]?.finishedInDarts).toBe(4)
  })

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
    await validerSortie(utilisateur)

    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())
    expect(ligneDe('Marie')).not.toHaveAttribute('aria-current')
    expect(ligneDe('Kevin')).not.toHaveAttribute('aria-current')
    expect(screen.queryByText('Vainqueur')).toBeNull()
  })

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
    await validerSortie(utilisateur)

    expect(await screen.findByRole('button', { name: 'Annuler 25 de Kevin' })).toBeInTheDocument()
  })

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
    await validerSortie(utilisateur)
    await waitFor(() => expect(cibleDe('Julien').closest('[aria-current]')).not.toBeNull())

    await utilisateur.click(await screen.findByRole('button', { name: 'Annuler 25 de Kevin' }))

    await waitFor(() => expect(cibleDe('Kevin').closest('[aria-current]')).not.toBeNull())
    expect(cibleDe('Kevin')).toHaveTextContent('Bulle')
    expect(ligneDe('Kevin')).toHaveTextContent('3 fléchettes')
    expect(screen.queryByText('Dernier tour')).toBeNull()

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

    expect(libelles.some((texte) => texte.includes('20→B'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('501'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('En cours'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('Abandonnée'))).toBe(true)
    const ligneMonde = libelles.find((texte) => texte.includes('20→B'))
    const ligneX01 = libelles.find((texte) => texte.includes('501'))
    expect(ligneMonde).toContain('En cours')
    expect(ligneMonde).not.toContain('Abandonnée')
    expect(ligneX01).toContain('Abandonnée')
    expect(ligneX01).not.toContain('En cours')
  })

  it('laisse les statistiques de carrière au X01', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')

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

    const regles = await screen.findByRole('region', { name: 'Réglages du jeu' })
    expect(within(regles).queryByRole('button', { name: '501' })).toBeNull()
    expect(within(regles).queryByRole('button', { name: /plus de réglages/i })).toBeNull()
    expect(within(regles).queryByText(/sur un double/i)).toBeNull()
    expect(within(regles).queryByRole('group', { name: 'Checkout' })).toBeNull()
    expect(within(regles).getByText('21 cibles · rien à régler')).toBeInTheDocument()
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
    await waitFor(() => expect(screen.getByText('1 / 4')).toBeInTheDocument())

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Cible de Kevin')).toBeInTheDocument()

    const historique = await services.getMatchHistory.execute()
    expect(historique[0]?.mode).toBe('TOUR_DU_MONDE')
  })
})
