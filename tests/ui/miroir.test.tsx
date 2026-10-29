import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { createServices, type Dependencies, type Services } from '@/composition/container'
import type { Haptics } from '@/core/application/ports/driven/Haptics'
import type { PeerLinks } from '@/core/application/ports/driven/PeerLinks'
import type { ScreenLock } from '@/core/application/ports/driven/ScreenLock'
import { type AnyMatchState, GAME_MODE_IDS, type GameModeId, GameModes } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import {
  FakeAnnouncer,
  FakePeerLinks,
  FakeQrEncoder,
  FakeQrScanner,
  fakeDependencies,
  ReseauFactice,
} from '../fakes'
import { lancer } from '../use-cases/lancerPartie'
import { renderWithServices } from './renderWithServices'

/** Un téléphone : ses services, et de quoi vérifier qu'il reste muet, éveillé, sans caméra ni lien imprévus. */
const telephone = (peerLinks: PeerLinks) => {
  const base = fakeDependencies({ peerLinks })
  const annonceur = new FakeAnnouncer()
  const vibrations: string[] = []
  const haptics: Haptics = {
    tap: () => vibrations.push('tap'),
    success: () => vibrations.push('success'),
    error: () => vibrations.push('error'),
  }
  const verrou = { demandes: 0 }
  const screenLock: ScreenLock = {
    request: async () => {
      verrou.demandes += 1
    },
    release: async () => {},
  }
  const scanner = new FakeQrScanner()
  const encodeur = new FakeQrEncoder()
  const dependencies: Dependencies = {
    ...base,
    devices: {
      ...base.devices,
      announcer: annonceur,
      haptics,
      screenLock,
      qrScanner: scanner,
      qrEncoder: encodeur,
    },
  }
  return {
    dependencies,
    services: createServices(dependencies),
    annonceur,
    vibrations,
    verrou,
    scanner,
    encodeur,
  }
}

type Telephone = ReturnType<typeof telephone>

const deuxTelephones = () => {
  const reseau = new ReseauFactice()
  const liensSaisie = new FakePeerLinks(reseau)
  const liensMiroir = new FakePeerLinks(reseau)
  return {
    reseau,
    liensSaisie,
    liensMiroir,
    saisie: telephone(liensSaisie),
    miroir: telephone(liensMiroir),
  }
}

const laisser = () => act(() => new Promise((resoudre) => setTimeout(resoudre, 0)))

/** Le jumelage sans écran : offre, réponse, acceptation. */
const jumeler = async (saisie: Services, miroir: Services) => {
  await saisie.shareMatch.start()
  const offre = saisie.shareMatch.state()
  if (offre.status !== 'offering') throw new Error(`offre attendue, ${offre.status}`)
  await miroir.watchMatch.answer(offre.token)
  const reponse = miroir.watchMatch.state()
  if (reponse.status !== 'answering') throw new Error(`réponse attendue, ${reponse.status}`)
  await saisie.shareMatch.acceptAnswer(reponse.token)
}

const joueurs = async (services: Services, mode: GameModeId): Promise<PlayerId[]> => {
  const lea = await services.managePlayers.create('Léa', 'lagon', 'FEMININE')
  const tom = await services.managePlayers.create('Tom', 'brique')
  return mode === 'CHECKOUT_PRACTICE' ? [lea.id] : [lea.id, tom.id]
}

const etat = async (t: Telephone, id: MatchId): Promise<AnyMatchState> => {
  const record = await t.dependencies.matches.findById(id)
  if (!record) throw new Error('partie introuvable')
  return GameModes.project(record.events)
}

/** Ce que fait `useVoleeEnCours` sur la saisie : publier l'état affiché et la volée en cours. */
const publier = async (t: Telephone, id: MatchId, darts: Dart[] = []) => {
  await act(async () => {
    t.services.shareMatch.publish({ matchId: id, base: await etat(t, id), darts })
  })
  await laisser()
}

const ouvrirMiroir = (t: Telephone) =>
  renderWithServices(<App />, { services: t.services, route: '/miroir' })

afterEach(() => {
  vi.useRealTimers()
})

const T20 = Dart.triple(20)
const S20 = Dart.single(20)

describe('Écran miroir — entrées', () => {
  it('les Réglages mènent au partage et au miroir', async () => {
    const { saisie } = deuxTelephones()
    const utilisateur = userEvent.setup()
    renderWithServices(<App />, { services: saisie.services, route: '/reglages' })

    const groupe = await screen.findByRole('region', { name: 'Écran miroir' })
    expect(within(groupe).getByRole('link', { name: /Servir de miroir/ })).toHaveAttribute(
      'href',
      '/miroir',
    )
    await utilisateur.click(within(groupe).getByRole('link', { name: /Partager la partie/ }))

    expect(await screen.findByRole('img', { name: 'Code à scanner' })).toBeInTheDocument()
    expect(saisie.encodeur.textes).toEqual(['OFFRE-1'])
  })

  it.each(GAME_MODE_IDS)(
    '%s : le bandeau porte le bouton miroir, sans voyant ni action sans geste',
    async (mode) => {
      const { saisie, liensSaisie } = deuxTelephones()
      const id = await lancer(saisie.services, mode, await joueurs(saisie.services, mode))
      renderWithServices(<App />, { services: saisie.services, route: `/partie/${id}` })

      const bouton = await screen.findByRole('link', { name: 'Écran miroir' })
      expect(bouton).toHaveAttribute('href', '/miroir/partager')
      expect(bouton.querySelector('[data-voyant]')).toBeNull()
      await laisser()

      // Ni lien, ni caméra, ni encodage du QR (le chargeur de la bibliothèque) sans action de l'utilisateur.
      expect(liensSaisie.offresFaites).toBe(0)
      expect(liensSaisie.reponsesFaites).toBe(0)
      expect(saisie.scanner.demarrages).toBe(0)
      expect(saisie.encodeur.textes).toEqual([])
    },
  )
})

describe('Écran miroir — jumelage par les écrans', () => {
  it('deux QR scannés relient les téléphones ; la caméra ne s’ouvre que sur le bouton', async () => {
    const { saisie, miroir } = deuxTelephones()
    const utilisateur = userEvent.setup()

    const ecranSaisie = renderWithServices(<App />, {
      services: saisie.services,
      route: '/miroir/partager',
    })
    const s = within(ecranSaisie.container)
    expect(await s.findByRole('img', { name: 'Code à scanner' })).toBeInTheDocument()
    expect(saisie.scanner.demarrages).toBe(0)

    const ecranMiroir = ouvrirMiroir(miroir)
    const m = within(ecranMiroir.container)
    expect(miroir.scanner.demarrages).toBe(0)
    await utilisateur.click(await m.findByRole('button', { name: 'Scanner le code' }))
    expect(miroir.scanner.demarrages).toBe(1)
    act(() => miroir.scanner.lire('OFFRE-1'))
    expect(await m.findByRole('img', { name: 'Code à scanner' })).toBeInTheDocument()
    await waitFor(() => expect(miroir.encodeur.textes).toEqual(['REPONSE-2']))

    await utilisateur.click(s.getByRole('button', { name: 'Scanner la réponse' }))
    expect(saisie.scanner.demarrages).toBe(1)
    act(() => saisie.scanner.lire('REPONSE-2'))

    expect(await s.findByText('Miroir connecté')).toBeInTheDocument()
    expect(await m.findByText('En attente d’une partie sur l’autre téléphone')).toBeInTheDocument()
  })

  it('le retour annule un jumelage en cours', async () => {
    const { saisie } = deuxTelephones()
    const utilisateur = userEvent.setup()
    renderWithServices(<App />, {
      services: saisie.services,
      historique: ['/reglages', '/miroir/partager'],
    })
    await screen.findByRole('img', { name: 'Code à scanner' })

    await utilisateur.click(screen.getByRole('button', { name: 'Retour' }))

    await waitFor(() => expect(saisie.services.shareMatch.state().status).toBe('idle'))
  })

  it('« Arrêter le partage » côté saisie : le miroir dit « Partage arrêté », pas « Connexion perdue »', async () => {
    const { saisie, miroir } = deuxTelephones()
    const utilisateur = userEvent.setup()
    await jumeler(saisie.services, miroir.services)
    const ecranMiroir = ouvrirMiroir(miroir)
    const m = within(ecranMiroir.container)
    await m.findByText('En attente d’une partie sur l’autre téléphone')

    const ecranSaisie = renderWithServices(<App />, {
      services: saisie.services,
      route: '/miroir/partager',
    })
    await utilisateur.click(
      await within(ecranSaisie.container).findByRole('button', { name: 'Arrêter le partage' }),
    )

    expect(await m.findByText('Partage arrêté')).toBeInTheDocument()
    expect(m.queryByText('Connexion perdue')).toBeNull()
  })
})

describe('Écran miroir — erreurs, jamais une boîte', () => {
  it('versions différentes, code illisible', async () => {
    const { miroir } = deuxTelephones()
    const utilisateur = userEvent.setup()
    ouvrirMiroir(miroir)

    await utilisateur.click(await screen.findByRole('button', { name: 'Scanner le code' }))
    act(() => miroir.scanner.lire('INCOMPATIBLE'))
    expect(await screen.findByText('Versions différentes')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()

    await utilisateur.click(screen.getByRole('button', { name: 'Scanner le code' }))
    act(() => miroir.scanner.lire('n’importe quoi'))
    expect(await screen.findByText('Code illisible')).toBeInTheDocument()
  })

  it('caméra refusée (avec « Réessayer »), puis absente', async () => {
    const { miroir } = deuxTelephones()
    const utilisateur = userEvent.setup()
    ouvrirMiroir(miroir)

    await utilisateur.click(await screen.findByRole('button', { name: 'Scanner le code' }))
    act(() => miroir.scanner.regler({ status: 'denied' }))
    expect(await screen.findByText('Caméra refusée')).toBeInTheDocument()
    await utilisateur.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(miroir.scanner.demarrages).toBe(2)

    act(() => miroir.scanner.regler({ status: 'absent' }))
    expect(await screen.findByText('Pas de caméra')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Scanner le code' })).toBeNull()
  })

  it('navigateur sans lien direct', async () => {
    const reseau = new ReseauFactice()
    const miroir = telephone(new FakePeerLinks(reseau, { indisponible: true }))
    const utilisateur = userEvent.setup()
    ouvrirMiroir(miroir)

    await utilisateur.click(await screen.findByRole('button', { name: 'Scanner le code' }))
    act(() => miroir.scanner.lire('OFFRE-1'))
    expect(await screen.findByText('Navigateur incompatible')).toBeInTheDocument()
  })
})

/** Le titre du bandeau du miroir, mode par mode (partie de `lancerPartie`). */
const TITRES = {
  X01: 'X01 · 501 · premier à 2 manches',
  TOUR_DU_MONDE: 'Tour du monde · 21 cibles',
  CRICKET: 'Cricket · standard',
  KILLER: 'Killer · 3 vies',
  CHECKOUT_PRACTICE: 'Entraînement · 3 checkouts',
} satisfies Record<GameModeId, string>

describe('Écran miroir — lecture seule, muet, éveillé', () => {
  it.each(GAME_MODE_IDS)(
    '%s : la partie partagée s’affiche, nom de partie compris, sans aucun bouton',
    async (mode) => {
      const { saisie, miroir } = deuxTelephones()
      await jumeler(saisie.services, miroir.services)
      const ecran = ouvrirMiroir(miroir)
      const m = within(ecran.container)
      await m.findByText('En attente d’une partie sur l’autre téléphone')

      const id = await lancer(
        saisie.services,
        mode,
        await joueurs(saisie.services, mode),
        'Revanche',
      )
      await publier(saisie, id)

      expect(await m.findByText(TITRES[mode])).toBeInTheDocument()
      expect(m.getByText('Revanche')).toBeInTheDocument()
      expect(m.getAllByText('Léa').length).toBeGreaterThan(0)
      expect(m.queryAllByRole('button')).toEqual([])
      expect(miroir.annonceur.annonces).toEqual([])
      expect(miroir.vibrations).toEqual([])
      expect(miroir.verrou.demandes).toBeGreaterThan(0)
    },
  )

  it('la saisie le pilote en direct depuis l’écran de partie (effet de la volée en cours)', async () => {
    const { saisie, miroir } = deuxTelephones()
    const utilisateur = userEvent.setup()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))

    const ecranMiroir = ouvrirMiroir(miroir)
    const m = within(ecranMiroir.container)
    const ecranSaisie = renderWithServices(<App />, {
      services: saisie.services,
      route: `/partie/${id}`,
    })
    const s = within(ecranSaisie.container)

    expect(await m.findByLabelText('Score restant de Léa')).toHaveTextContent('501')
    await utilisateur.click(await s.findByRole('button', { name: 'Triple' }))
    await utilisateur.click(s.getByRole('button', { name: '20' }))

    await waitFor(() => expect(m.getByLabelText('Score restant de Léa')).toHaveTextContent('441'))
    expect(m.getByLabelText('Volée de Léa')).toHaveTextContent('T20')
    expect(s.getByRole('link', { name: 'Écran miroir, connecté' })).toBeInTheDocument()
  })
})

describe('Écran miroir — la sortie en attente (variante A) et la fin', () => {
  it('X01 : la fléchette de sortie en pointillé, le reste inchangé, rien de célébré, puis « Partie ! »', async () => {
    const { saisie, miroir } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const [lea, tom] = await joueurs(saisie.services, 'X01')
    if (!lea || !tom) throw new Error('deux joueurs')
    const id = await saisie.services.startMatch.execute({
      playerIds: [lea, tom],
      config: X01Config.create({
        startingScore: 101,
        legsToWin: 1,
      }),
    })
    const ecran = ouvrirMiroir(miroir)
    const m = within(ecran.container)

    await publier(saisie, id, [Dart.single(1), T20, Dart.double(20)])
    const volee = await m.findByLabelText('Volée de Léa')
    expect(volee.querySelector('[data-attente="oui"]')).toHaveTextContent('D20')
    expect(m.getByLabelText('Score restant de Léa')).toHaveTextContent(/^40$/)
    expect(m.queryByText('Partie !')).toBeNull()

    await act(() => saisie.services.recordVisit.execute({ matchId: id, darts: [T20, S20] }))
    await publier(saisie, id)
    expect(await m.findByLabelText('Score restant de Tom')).toHaveTextContent('101')
    await act(() => saisie.services.recordVisit.execute({ matchId: id, darts: [S20, S20, S20] }))
    await publier(saisie, id)
    await act(() =>
      saisie.services.recordVisit.execute({
        matchId: id,
        darts: [Dart.single(1), Dart.double(10)],
      }),
    )
    await publier(saisie, id)

    expect((await m.findAllByText('Partie !')).length).toBeGreaterThan(0)
    expect(m.getAllByText('Léa').length).toBeGreaterThan(0)
    // La manche gagnée se lit sur tout le match : `legsWonInSet` retombe à 0 au dernier set.
    expect(m.getAllByText('1 manche').length).toBeGreaterThan(0)
  })

  it('Killer : « Éliminée par Tom », accordé au genre de l’éliminée', async () => {
    const { saisie, miroir } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(saisie.services, 'KILLER', await joueurs(saisie.services, 'KILLER'))
    const depart = await etat(saisie, id)
    if (depart.mode !== 'KILLER') throw new Error('Killer attendu')
    const [numLea, numTom] = depart.players.map((joueur) => joueur.number)
    if (numLea === undefined || numTom === undefined) throw new Error('deux numéros')
    const ecran = ouvrirMiroir(miroir)
    const m = within(ecran.container)

    await saisie.services.playKiller.recordVisit(id, [Dart.miss(), Dart.miss(), Dart.miss()])
    await saisie.services.playKiller.recordVisit(id, [Dart.double(numTom), Dart.triple(numLea)])
    await publier(saisie, id)

    expect(await m.findByText('Éliminée par Tom')).toBeInTheDocument()
  })
})

describe('Écran miroir — bandeaux muets', () => {
  it('X01 : bust puis 180, avec le nom du joueur', async () => {
    const { saisie, miroir } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    const ecran = ouvrirMiroir(miroir)
    const m = within(ecran.container)
    await publier(saisie, id)
    await m.findByLabelText('Score restant de Léa')

    await saisie.services.recordVisit.execute({ matchId: id, darts: [T20, T20, T20] })
    await publier(saisie, id)
    expect(await m.findByText('180 !')).toBeInTheDocument()
  })

  it('entraînement : aucun bandeau', async () => {
    const { saisie, miroir } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(
      saisie.services,
      'CHECKOUT_PRACTICE',
      await joueurs(saisie.services, 'CHECKOUT_PRACTICE'),
    )
    const ecran = ouvrirMiroir(miroir)
    const m = within(ecran.container)
    await publier(saisie, id)
    await m.findByText(TITRES.CHECKOUT_PRACTICE)

    await saisie.services.playCheckoutPractice.recordVisit(id, [T20, T20, T20])
    await publier(saisie, id)

    await waitFor(() => expect(m.getByText('Manche 2/3')).toBeInTheDocument())
    expect(m.queryByText('Bust')).toBeNull()
    expect(m.queryByText('180 !')).toBeNull()
  })
})

describe('Écran miroir — coupure', () => {
  it('moins de 5 s : rien ; au-delà : « Connexion perdue » sur l’image figée ; le lien revient : bandeau retiré', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    const ecranMiroir = ouvrirMiroir(miroir)
    const m = within(ecranMiroir.container)
    await publier(saisie, id)
    await m.findByLabelText('Score restant de Léa')

    vi.useFakeTimers()
    act(() => reseau.couper())
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(m.queryByText('Connexion perdue')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(m.getByText('Connexion perdue')).toBeInTheDocument()
    expect(m.getByLabelText('Score restant de Léa')).toHaveTextContent('501')

    act(() => reseau.retablir())
    expect(m.queryByText('Connexion perdue')).toBeNull()
    expect(m.getByLabelText('Score restant de Léa')).toHaveTextContent('501')
  })

  it('le voyant de la saisie : vert, toujours vert sous 5 s de coupure, rouge au-delà', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const id = await lancer(saisie.services, 'CRICKET', await joueurs(saisie.services, 'CRICKET'))
    renderWithServices(<App />, { services: saisie.services, route: `/partie/${id}` })
    expect(await screen.findByRole('link', { name: 'Écran miroir, connecté' })).toBeInTheDocument()

    vi.useFakeTimers()
    act(() => reseau.couper())
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByRole('link', { name: 'Écran miroir, connecté' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.getByRole('link', { name: 'Écran miroir, connexion perdue' })).toBeInTheDocument()
  })
})
