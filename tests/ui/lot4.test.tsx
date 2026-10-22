import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { fakeServices, SettableClock } from '../fakes'
import { renderWithServices } from './renderWithServices'

const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]

const basePeuplee = async (services: Services) => {
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create({ legsToWin: 1 }),
  })
  await services.recordVisit.execute({ matchId, darts: T20 })
  return { kevin, julien, matchId }
}

describe('Navigation principale', () => {
  it('n’a que quatre onglets, sans « Joueurs »', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/' })

    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' })
    const onglets = within(navigation).getAllByRole('link')
    expect(onglets.map((onglet) => onglet.textContent)).toEqual([
      'Début',
      'Stats',
      'Parties',
      'Réglages',
    ])
    expect(within(navigation).queryByRole('link', { name: 'Joueurs' })).toBeNull()
  })

  it('mène des Réglages à l’écran de gestion des joueurs', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    await utilisateur.click(await screen.findByRole('link', { name: /gérer les joueurs/i }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Joueurs' })).toBeInTheDocument()
  })

  it('mène de l’accueil aux trois autres écrans, et pas pendant une partie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/' })

    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' })

    await utilisateur.click(within(navigation).getByRole('link', { name: 'Stats' }))
    expect(await screen.findByRole('heading', { name: 'Statistiques' })).toBeInTheDocument()

    await utilisateur.click(within(navigation).getByRole('link', { name: 'Parties' }))
    expect(await screen.findByRole('heading', { name: 'Parties' })).toBeInTheDocument()

    await utilisateur.click(within(navigation).getByRole('link', { name: 'Réglages' }))
    expect(await screen.findByRole('heading', { name: 'Réglages' })).toBeInTheDocument()
  })

  it('disparaît pendant une partie, où chaque pixel sert à jouer', async () => {
    const { services } = fakeServices()
    const { matchId } = await basePeuplee(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    await screen.findByLabelText('Score restant de Kevin')
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
  })
})

describe('Écran Joueurs', () => {
  it('crée un profil, le renomme et le repeint', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/joueurs' })

    expect(await screen.findByText(/personne à l’oche/i)).toBeInTheDocument()

    await utilisateur.type(screen.getByLabelText('Nouveau joueur'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter' }))

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Kevin' }))

    const champ = screen.getByLabelText('Pseudo de Kevin')
    await utilisateur.clear(champ)
    await utilisateur.type(champ, 'Kéké')
    await utilisateur.click(screen.getByRole('button', { name: 'Prune' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getByText('Kéké')).toBeInTheDocument())

    const profils = await services.managePlayers.listAll()
    expect(profils[0]?.name).toBe('Kéké')
    expect(profils[0]?.color).toBe('prune')
  })

  it('demande confirmation avant de supprimer un profil', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')
    renderWithServices(<App />, { services, route: '/joueurs' })

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Kevin' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(await services.managePlayers.listAll()).toHaveLength(1)

    await utilisateur.click(
      screen.getByRole('button', { name: 'Confirmer la suppression de Kevin' }),
    )
    await waitFor(async () => expect(await services.managePlayers.listAll()).toHaveLength(0))
  })
})

describe('Écran Parties', () => {
  it('liste les parties, leur statut, et en supprime une', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await basePeuplee(services)

    renderWithServices(<App />, { services, route: '/historique' })

    expect(await screen.findByText('En cours')).toBeInTheDocument()
    expect(screen.queryByText('Reprendre')).not.toBeInTheDocument()
    expect(screen.queryByText(/abandonnée/i)).not.toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Supprimer la partie' }))
    await utilisateur.click(
      screen.getByRole('button', { name: 'Confirmer la suppression de la partie' }),
    )

    expect(await screen.findByText(/rien au tableau/i)).toBeInTheDocument()
    expect(await services.getMatchHistory.execute()).toEqual([])
  })
})

describe('Historique — filtre de mode', () => {
  const deuxModes = async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.playCricket.start({
      playerIds: [kevin.id],
      config: CricketConfig.create(),
    })
    return services
  }

  it('ne garde que le mode choisi', async () => {
    const utilisateur = userEvent.setup()
    const services = await deuxModes()
    renderWithServices(<App />, { services, route: '/historique' })

    expect(await screen.findByText(/2 parties enregistrées/i)).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Cricket' }))

    expect(await screen.findByText(/1 partie · Cricket/i)).toBeInTheDocument()
  })

  it('distingue « aucune partie de ce mode » d’un historique vide', async () => {
    const utilisateur = userEvent.setup()
    const services = await deuxModes()
    renderWithServices(<App />, { services, route: '/historique' })

    await screen.findByText(/2 parties enregistrées/i)
    await utilisateur.click(screen.getByRole('button', { name: 'Monde' }))

    // ⚠️ Surtout pas « Rien au tableau » : les deux parties sont intactes.
    expect(await screen.findByText(/aucune partie de tour du monde/i)).toBeInTheDocument()
    expect(screen.queryByText(/rien au tableau/i)).not.toBeInTheDocument()
  })
})

describe('Écran Statistiques', () => {
  it('classe les joueurs sur la moyenne, meilleur en tête', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [julien.id, kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.single(20), Dart.single(20), Dart.single(20)],
    })
    await services.recordVisit.execute({ matchId, darts: T20 })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyennes = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    const lignes = within(moyennes).getAllByRole('listitem')

    expect(within(lignes[0] as HTMLElement).getByText('Kevin')).toBeInTheDocument()
    expect(within(lignes[1] as HTMLElement).getByText('Julien')).toBeInTheDocument()
  })

  it('Victoires donne à chaque joueur son dénominateur, sans manches ni %', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 501, legsToWin: 2 }),
    })
    const RIEN = [Dart.miss(), Dart.miss(), Dart.miss()]
    for (const darts of [T20, RIEN, T20, RIEN]) {
      await services.recordVisit.execute({ matchId, darts })
    }
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.triple(20), Dart.triple(19), Dart.double(12)],
    })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const victoires = await screen.findByRole('region', { name: 'Victoires' })

    for (const nom of ['Kevin', 'Julien']) {
      const ligne = within(victoires)
        .getAllByRole('listitem')
        .find((li) => within(li).queryByText(nom)) as HTMLElement
      expect(within(ligne).getByText('0')).toBeInTheDocument()
      expect(within(ligne).getByText('/ 1')).toBeInTheDocument()
    }
    expect(victoires).toHaveTextContent('/ 1')
    expect(victoires).not.toHaveTextContent(/manche/i)
    expect(victoires).not.toHaveTextContent('%')
  })

  it('invite à jouer quand il n’y a rien à comparer', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect(await screen.findByText(/aucune partie au compteur/i)).toBeInTheDocument()
  })

  it('restreint le cumul à la soirée quand on le demande', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(new Date(2026, 7, 26, 21).getTime())
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')

    const ancienne = async (instant: number) => {
      horloge.regler(instant)
      const matchId = await services.startMatch.execute({
        playerIds: [kevin.id],
        config: X01Config.create({ legsToWin: 1 }),
      })
      await services.recordVisit.execute({ matchId, darts: T20 })
    }

    await ancienne(new Date(2026, 6, 3, 20).getTime())
    await ancienne(new Date(2026, 7, 26, 20).getTime())
    horloge.regler(new Date(2026, 7, 26, 21).getTime())

    renderWithServices(<App />, { services, route: '/statistiques' })

    const victoires = await screen.findByRole('region', { name: 'Victoires' })
    expect(within(victoires).getAllByText('/ 2').length).toBeGreaterThan(0)

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))

    await waitFor(() => {
      const cejour = screen.getByRole('region', { name: 'Victoires' })
      expect(within(cejour).queryAllByText('/ 2')).toHaveLength(0)
      expect(within(cejour).getAllByText('/ 1').length).toBeGreaterThan(0)
    })
  })

  it('distingue « rien ce soir » de « jamais joué »', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(new Date(2026, 7, 26, 21).getTime())
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')

    horloge.regler(new Date(2026, 6, 3, 20).getTime())
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })
    horloge.regler(new Date(2026, 7, 26, 21).getTime())

    renderWithServices(<App />, { services, route: '/statistiques' })
    await screen.findByRole('region', { name: 'Victoires' })

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))

    // ⚠️ Surtout pas « Aucune partie au compteur » : la base est intacte.
    expect(await screen.findByText(/rien sur cette période/i)).toBeInTheDocument()
    expect(screen.queryByText(/aucune partie au compteur/i)).not.toBeInTheDocument()
  })

  it('dessine une carte d’impacts qui nomme les cases les plus touchées', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.single(5), Dart.single(5), Dart.miss()],
    })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const plateau = await screen.findByRole('img', {
      name: /Kevin : T20 3 fois, S5 2 fois, sur 6 fléchettes/,
    })
    const cases = within(plateau.closest('figure') as HTMLElement).getAllByRole('listitem')
    expect(cases.map((c) => c.textContent)).toEqual(['T203 fois', 'S52 fois', '1hors cible'])
  })

  it('distingue tiret / pourcentage / « 0 % » pour le % de doubles de la carrière', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const david = await services.managePlayers.create('David')

    const matchKevin = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId: matchKevin,
      darts: [Dart.miss(), Dart.miss(), Dart.double(20)],
    })

    const matchJulien = await services.startMatch.execute({
      playerIds: [julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId: matchJulien,
      darts: [Dart.miss(), Dart.miss(), Dart.miss()],
    })

    const matchDavid = await services.startMatch.execute({
      playerIds: [david.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId: matchDavid,
      darts: [Dart.single(5), Dart.single(5), Dart.miss()],
    })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const finitions = await screen.findByRole('region', { name: 'Finitions' })
    const lignes = within(finitions).getAllByRole('listitem')
    const attendues = [
      ['Kevin', '33 %'],
      ['Julien', '0 %'],
      ['David', '—'],
    ] as const
    expect(lignes).toHaveLength(attendues.length)
    attendues.forEach(([nom, valeur], rang) => {
      const ligne = within(lignes[rang] as HTMLElement)
      expect(ligne.getByText(nom)).toBeInTheDocument()
      expect(ligne.getByText(valeur)).toBeInTheDocument()
    })
  })
})

describe('Écran Réglages', () => {
  it('restaure une sauvegarde déposée par l’utilisateur', async () => {
    const utilisateur = userEvent.setup()

    const ailleurs = fakeServices().services
    await basePeuplee(ailleurs)
    const sauvegarde = await ailleurs.manageBackup.exportAll()

    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    const fichier = new File([JSON.stringify(sauvegarde)], 'dartpero.json', {
      type: 'application/json',
    })
    await utilisateur.upload(await screen.findByLabelText('Fichier de sauvegarde'), fichier)

    expect(await screen.findByText(/sauvegarde restaurée/i)).toBeInTheDocument()
    expect(screen.getByText(/2 joueurs et 1 partie importés/i)).toBeInTheDocument()
    expect(await services.getMatchHistory.execute()).toHaveLength(1)
  })

  it('refuse un JSON qui n’est pas une sauvegarde Dartpéro', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    const fichier = new File([JSON.stringify({ hello: 'world' })], 'autre.json', {
      type: 'application/json',
    })
    await utilisateur.upload(await screen.findByLabelText('Fichier de sauvegarde'), fichier)

    expect(await screen.findByRole('alert')).toHaveTextContent(/sauvegarde Dartpéro/i)
  })
})
