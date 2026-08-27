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

/** Une base déjà vécue : deux joueurs et une partie entamée. */
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
  it('mène de l’accueil aux quatre écrans, et pas pendant une partie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/' })

    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' })

    await utilisateur.click(within(navigation).getByRole('link', { name: 'Joueurs' }))
    expect(await screen.findByRole('heading', { name: 'Joueurs' })).toBeInTheDocument()

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

    // Premier clic : rien n'est perdu, on demande seulement confirmation.
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
    expect(screen.getByText('321')).toBeInTheDocument()

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

    // Sans filtre, les deux parties sont là.
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
    // Julien commence et marque 60, Kevin enchaîne un 180.
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.single(20), Dart.single(20), Dart.single(20)],
    })
    await services.recordVisit.execute({ matchId, darts: T20 })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyennes = await screen.findByRole('table', { name: 'Moyennes' })
    const lignes = within(moyennes).getAllByRole('row').slice(1)

    expect(within(lignes[0] as HTMLElement).getByText('Kevin')).toBeInTheDocument()
    expect(within(lignes[1] as HTMLElement).getByText('Julien')).toBeInTheDocument()
  })

  it('donne aux legs leur dénominateur', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    // Un leg gagné par Kevin en 9 fléchettes ; Julien n'a rien pris.
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

    const legs = await screen.findByRole('table', { name: 'Legs' })
    const lignes = within(legs).getAllByRole('row').slice(1)

    // Kevin : 1 gagné sur 1 joué, donc 100 %.
    const kevinLigne = lignes.find((ligne) => within(ligne).queryByText('Kevin')) as HTMLElement
    expect(within(kevinLigne).getByText('100 %')).toBeInTheDocument()

    // ⚠️ Julien : 0 sur 1, donc « 0 % » — pas un tiret. Il a bien perdu ce leg.
    const julienLigne = lignes.find((ligne) => within(ligne).queryByText('Julien')) as HTMLElement
    expect(within(julienLigne).getByText('0 %')).toBeInTheDocument()
  })

  it('écrit un tiret, jamais « 0 % », quand aucun leg n’est terminé', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })

    renderWithServices(<App />, { services, route: '/statistiques' })

    // « 0 % » voudrait dire « il a tout perdu » ; rien du tout veut dire
    // « on ne sait pas encore », et un leg en cours n'est ni gagné ni perdu.
    const legs = await screen.findByRole('table', { name: 'Legs' })
    expect(within(legs).getByText('—')).toBeInTheDocument()
    expect(within(legs).queryByText('0 %')).not.toBeInTheDocument()
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

    // « Tout » par défaut : les deux parties sont au compteur.
    const palmares = await screen.findByRole('table', { name: 'Palmarès' })
    expect(within(palmares).getByText('2')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))

    await waitFor(() => {
      const cejour = screen.getByRole('table', { name: 'Palmarès' })
      expect(within(cejour).queryByText('2')).not.toBeInTheDocument()
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
    await screen.findByRole('table', { name: 'Palmarès' })

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))

    // ⚠️ Surtout pas « Aucune partie au compteur » : la base est intacte, et le
    // faire croire serait la pire chose que cet écran puisse dire.
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

    // La couleur ne se teste pas ; le nom accessible, lui, porte la donnée —
    // et c'est aussi ce qu'un lecteur d'écran restitue.
    expect(
      await screen.findByRole('img', { name: /Kevin : T20 3 fois, S5 2 fois, sur 6 fléchettes/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Hors cible ×1')).toBeInTheDocument()
  })
})

describe('Écran Réglages', () => {
  it('restaure une sauvegarde déposée par l’utilisateur', async () => {
    const utilisateur = userEvent.setup()

    // La sauvegarde vient d'un autre téléphone : on l'exporte depuis une base
    // à part, exactement comme dans la vraie vie.
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
