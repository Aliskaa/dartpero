import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Dependencies, type Services } from '@/composition/container'
import type { Announcer } from '@/core/application/ports/driven/Announcer'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { type EtatVolee, useVoleeEnCours } from '@/ui/hooks/useVoleeEnCours'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import {
  BrouillonsEnPanne,
  BrouillonsIllisibles,
  BrouillonsSuspendus,
  CyclingRandomSource,
  DepotEnPanne,
  fakeDependencies,
  SettableClock,
} from '../fakes'
import { flechette, locationCourante, retourTelephone, validerSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

/**
 * Lot `volee-partielle`, à l'écran : les fléchettes de la volée en cours
 * survivent à un rechargement, sans message ; la boîte « Valider la sortie »
 * revient si sa fléchette attendait ; rien n'est dit ni célébré à la reprise.
 *
 * « Rechargement » : l'application est démontée, puis rendue à neuf avec les
 * **mêmes services** (le même disque) et un **nouveau** `QueryClient` (la
 * mémoire de la page est perdue).
 */

const banc = (surcharges: Partial<Dependencies> = {}) => {
  const dites: string[] = []
  const announcer: Announcer = {
    say: (annonce) => dites.push(annonce.map((segment) => segment.texte).join('')),
    cancel: () => {},
  }
  const clock = new SettableClock()
  const random = new CyclingRandomSource()
  const base = fakeDependencies({ clock, random, ...surcharges })
  const dependencies = { ...base, devices: { ...base.devices, announcer } }
  return { dites, clock, random, dependencies, services: createServices(dependencies) }
}

const joueurs = async (services: Services, noms = ['Kevin', 'Julien']) => {
  const ids = []
  for (const nom of noms) ids.push((await services.managePlayers.create(nom)).id)
  return ids
}

const ouvrir = (services: Services, matchId: MatchId) =>
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })

/** Le brouillon de la partie, tel que le disque le garde. */
const brouillon = (dependencies: Dependencies, matchId: MatchId) =>
  dependencies.visitDrafts.findById(matchId)

/** Attend que les écritures du brouillon (asynchrones, en file) aient abouti. */
const attendreBrouillon = async (dependencies: Dependencies, matchId: MatchId, n: number) =>
  waitFor(async () => expect((await brouillon(dependencies, matchId))?.darts ?? []).toHaveLength(n))

const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)
const boite = () => screen.queryByRole('dialog')

type Utilisateur = ReturnType<typeof userEvent.setup>

type Mode = {
  readonly nom: string
  readonly demarrer: (services: Services) => Promise<MatchId>
  readonly attendre: () => Promise<HTMLElement>
  readonly poser: (utilisateur: Utilisateur) => Promise<void>
  readonly derniere: string
  readonly affiche: (services: Services, id: MatchId) => Promise<unknown>
  /** Trois fléchettes qui closent la volée sans finir la partie (N-1). */
  readonly clore: readonly [string, string, string]
}

/**
 * Les modes : une partie neuve, deux fléchettes posées, ce qui doit revenir.
 * Indexés par `GameModeId` : un mode nouveau fait échouer la compilation tant
 * qu'il n'a pas son entrée (`rules/testing.md`).
 */
const PAR_MODE = {
  X01: {
    nom: 'X01',
    demarrer: async (services: Services) =>
      services.startMatch.execute({
        playerIds: await joueurs(services),
        config: X01Config.create(),
      }),
    attendre: () => screen.findByLabelText('Score restant de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await flechette(utilisateur, '20')
      await flechette(utilisateur, '19', 'Triple')
    },
    derniere: 'Annuler T19 de Kevin',
    affiche: async () => expect(scoreDe('Kevin')).toHaveTextContent('424'),
    clore: ['1', '1', '1'],
  },
  CRICKET: {
    nom: 'Cricket',
    demarrer: async (services: Services) =>
      services.playCricket.start({
        playerIds: await joueurs(services),
        config: CricketConfig.create(),
      }),
    attendre: () => screen.findByLabelText('Points de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await flechette(utilisateur, '20')
      await flechette(utilisateur, '19', 'Double')
    },
    derniere: 'Annuler D19 de Kevin',
    affiche: async () =>
      expect(screen.getByLabelText('Volée de Kevin')).toHaveTextContent('S20D19—'),
    // Le 20 fermé, six cibles encore ouvertes : la partie continue.
    clore: ['20', '20', '20'],
  },
  TOUR_DU_MONDE: {
    nom: 'Tour du monde',
    demarrer: async (services: Services) =>
      services.playTourDuMonde.start({
        playerIds: await joueurs(services),
        config: TourDuMondeConfig.create(),
      }),
    attendre: () => screen.findByLabelText('Cible de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await utilisateur.click(screen.getByRole('button', { name: '20' }))
      await utilisateur.click(screen.getByRole('button', { name: '19' }))
    },
    derniere: 'Annuler 19 de Kevin',
    affiche: async () => expect(screen.getByLabelText('Cible de Kevin')).toHaveTextContent('18'),
    // 20, 19, 18 : trois cibles validées, dix-huit encore à faire.
    clore: ['20', '19', '18'],
  },
  CHECKOUT_PRACTICE: {
    nom: 'Entraînement',
    demarrer: async (services: Services) => {
      const [kevin] = await joueurs(services, ['Kevin'])
      if (!kevin) throw new Error('joueur attendu')
      return services.playCheckoutPractice.start({
        playerId: kevin,
        config: CheckoutPracticeConfig.create({ rounds: 5 }),
      })
    },
    attendre: () => screen.findByLabelText('Reste pour le checkout'),
    poser: async (utilisateur: Utilisateur) => {
      await flechette(utilisateur, '1')
      await flechette(utilisateur, '2')
    },
    derniere: 'Annuler S2 de Kevin',
    affiche: async (services: Services, id: MatchId) => {
      // Un simple 1 puis un simple 2 : le reste tiré (au journal), moins 3.
      const cible = (await services.playCheckoutPractice.getState(id)).current?.target ?? 0
      expect(cible).toBeGreaterThanOrEqual(41)
      expect(screen.getByLabelText('Reste pour le checkout')).toHaveTextContent(String(cible - 3))
    },
    // Le reste tiré vaut au moins 41 : trois simples 1 ne le finissent pas.
    clore: ['1', '1', '1'],
  },
} satisfies Record<GameModeId, Mode>

const MODES = GAME_MODE_IDS.map((id) => PAR_MODE[id])

describe.each(MODES)('$nom : la volée en cours survit au rechargement', (mode) => {
  it('une puis deux fléchettes posées sont rendues à l’identique, pavé actif, rien de dit', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, dites } = banc()
    const id = await mode.demarrer(services)

    const avant = ouvrir(services, id)
    await mode.attendre()
    await mode.poser(utilisateur)
    expect(screen.getByRole('button', { name: mode.derniere })).toBeEnabled()
    await attendreBrouillon(dependencies, id, 2)
    avant.unmount()

    ouvrir(services, id)
    await mode.attendre()

    expect(screen.getByRole('button', { name: mode.derniere })).toBeEnabled()
    await mode.affiche(services, id)
    expect(screen.getByRole('button', { name: '20' })).toBeEnabled()
    // La reprise est silencieuse : rien n'est dit, rien n'est écrit au journal.
    expect(dites).toEqual([])
    expect((await brouillon(dependencies, id))?.darts).toHaveLength(2)
  })
})

describe('Volée en cours — X01 au détail', () => {
  it('une seule fléchette rendue, et la saisie reprend dessus', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const id = await PAR_MODE.X01.demarrer(services)
    const avant = ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    await flechette(utilisateur, '20', 'Triple')
    await attendreBrouillon(dependencies, id, 1)
    avant.unmount()

    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('441'))
    // La saisie reprend après la fléchette rendue (la bascule : test suivant).
    await flechette(utilisateur, '20')
    expect(scoreDe('Kevin')).toHaveTextContent('421')
    await attendreBrouillon(dependencies, id, 2)
  })

  it('la bascule n’est jamais gardée : « Triple » armé sans lancer retombe sur Simple à la reprise', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const id = await PAR_MODE.X01.demarrer(services)
    const avant = ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    await flechette(utilisateur, '20')
    await attendreBrouillon(dependencies, id, 1)
    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    // Précondition : la bascule est bien enfoncée quand l'application est tuée.
    expect(screen.getByRole('button', { name: 'Triple' })).toHaveAttribute('aria-pressed', 'true')
    avant.unmount()

    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('481'))
    expect(screen.getByRole('button', { name: 'Triple' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Simple' })).toHaveAttribute('aria-pressed', 'true')
    // La fléchette suivante est donc un simple.
    await flechette(utilisateur, '20')
    expect(scoreDe('Kevin')).toHaveTextContent('461')
  })

  it('le brouillon est effacé après trois fléchettes, après un bust, après une sortie validée', async () => {
    const utilisateur = userEvent.setup()

    // Trois fléchettes.
    const trois = banc()
    const id = await PAR_MODE.X01.demarrer(trois.services)
    const vue = ouvrir(trois.services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    for (const _ of [0, 1]) await flechette(utilisateur, '1')
    // Précondition : la volée ouverte est bien au brouillon avant la troisième.
    await attendreBrouillon(trois.dependencies, id, 2)
    await flechette(utilisateur, '1')
    await waitFor(async () =>
      expect((await trois.services.getMatchState.execute(id)).history).toHaveLength(1),
    )
    await waitFor(async () => expect(await brouillon(trois.dependencies, id)).toBeNull())
    vue.unmount()

    // Un bust : la volée part sans confirmation, son brouillon s'efface.
    const bust = banc()
    const idBust = await bust.services.startMatch.execute({
      playerIds: await joueurs(bust.services),
      config: X01Config.create({ startingScore: 50 }),
    })
    const vueBust = ouvrir(bust.services, idBust)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('50'))
    // S20 laisse 30, la volée reste ouverte : précondition, elle est au brouillon.
    await flechette(utilisateur, '20')
    await attendreBrouillon(bust.dependencies, idBust, 1)
    await flechette(utilisateur, '20', 'Triple')
    await waitFor(async () =>
      expect((await bust.services.getMatchState.execute(idBust)).history).toHaveLength(1),
    )
    await waitFor(async () => expect(await brouillon(bust.dependencies, idBust)).toBeNull())
    vueBust.unmount()

    // Une sortie validée.
    const sortie = banc()
    const idSortie = await sortie.services.startMatch.execute({
      playerIds: await joueurs(sortie.services),
      config: X01Config.create({ startingScore: 40, legsToWin: 2 }),
    })
    ouvrir(sortie.services, idSortie)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    await flechette(utilisateur, '20', 'Double')
    await attendreBrouillon(sortie.dependencies, idSortie, 1)
    await validerSortie(utilisateur)
    expect(await screen.findByText('Manche !')).toBeInTheDocument()
    await waitFor(async () => expect(await brouillon(sortie.dependencies, idSortie)).toBeNull())
  })

  it('la volée rouverte par Annuler survit au rechargement', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const id = await PAR_MODE.X01.demarrer(services)
    await services.recordVisit.execute({
      matchId: id,
      darts: [Dart.triple(20), Dart.triple(19), Dart.single(5)],
    })

    const avant = ouvrir(services, id)
    await utilisateur.click(await screen.findByRole('button', { name: 'Annuler S5 de Kevin' }))
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('384'))
    await attendreBrouillon(dependencies, id, 2)
    avant.unmount()

    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('384'))
    expect(screen.getByRole('button', { name: 'Annuler T19 de Kevin' })).toBeEnabled()
    expect((await services.getMatchState.execute(id)).history).toHaveLength(0)
  })
})

describe('Volée en cours — entraînement', () => {
  it('la manche rouverte survit au rechargement : même reste, aucun nouveau tirage', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, random } = banc()
    const id = await PAR_MODE.CHECKOUT_PRACTICE.demarrer(services)
    const cible = (await services.playCheckoutPractice.getState(id)).current?.target ?? 0
    await services.playCheckoutPractice.recordVisit(id, [
      Dart.single(1),
      Dart.single(1),
      Dart.single(1),
    ])

    const avant = ouvrir(services, id)
    await utilisateur.click(await screen.findByRole('button', { name: 'Annuler S1 de Kevin' }))
    await attendreBrouillon(dependencies, id, 2)
    avant.unmount()
    const tirages = random.tirages

    ouvrir(services, id)
    const reste = await screen.findByLabelText('Reste pour le checkout')
    expect(Number(reste.textContent)).toBe(cible - 2)
    expect(screen.getByRole('button', { name: 'Annuler S1 de Kevin' })).toBeEnabled()
    // La reprise ne consulte pas la source d'aléa : le reste est au journal.
    expect(random.tirages).toBe(tirages)
    expect(boite()).toBeNull()
  })

  it('la manche close efface le brouillon', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const id = await PAR_MODE.CHECKOUT_PRACTICE.demarrer(services)
    ouvrir(services, id)
    await PAR_MODE.CHECKOUT_PRACTICE.attendre()

    // Le reste tiré vaut au moins 41 : trois simples 1 ne le finissent pas.
    for (const _ of [0, 1]) await flechette(utilisateur, '1')
    await attendreBrouillon(dependencies, id, 2)
    await flechette(utilisateur, '1')

    await waitFor(async () =>
      expect((await services.playCheckoutPractice.getState(id)).roundsPlayed).toBe(1),
    )
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })
})

describe('Volée en cours — Tour du monde au détail', () => {
  it('la volée rouverte par Annuler survit au rechargement', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = banc()
    const id = await PAR_MODE.TOUR_DU_MONDE.demarrer(services)
    await services.playTourDuMonde.recordVisit(id, [
      Dart.single(20),
      Dart.single(19),
      Dart.single(5),
    ])

    const avant = ouvrir(services, id)
    await utilisateur.click(await screen.findByRole('button', { name: 'Annuler 5 de Kevin' }))
    await waitFor(() => expect(screen.getByLabelText('Cible de Kevin')).toHaveTextContent('18'))
    await attendreBrouillon(dependencies, id, 2)
    avant.unmount()

    ouvrir(services, id)
    await waitFor(() => expect(screen.getByLabelText('Cible de Kevin')).toHaveTextContent('18'))
    expect(screen.getByRole('button', { name: 'Annuler 19 de Kevin' })).toBeEnabled()
    expect((await services.playTourDuMonde.getState(id)).history).toHaveLength(0)
  })
})

/** La boîte « Valider la sortie » revient si sa fléchette attendait. */
const SORTIES = [
  {
    nom: 'X01',
    demarrer: async (services: Services) =>
      services.startMatch.execute({
        playerIds: await joueurs(services),
        config: X01Config.create({ startingScore: 40, legsToWin: 2 }),
      }),
    attendre: () => screen.findByLabelText('Score restant de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await flechette(utilisateur, '20')
      await flechette(utilisateur, '10', 'Double')
    },
    nombre: 2,
    titre: 'Kevin sort sur D10 ?',
    apresValider: 'Manche !',
    volees: async (services: Services, id: MatchId) =>
      (await services.getMatchState.execute(id)).history.length,
  },
  {
    nom: 'Cricket',
    demarrer: async (services: Services) =>
      services.playCricket.start({
        playerIds: await joueurs(services),
        config: CricketConfig.create({ targets: [20] }),
      }),
    attendre: () => screen.findByLabelText('Points de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await flechette(utilisateur, '20', 'Triple')
    },
    nombre: 1,
    titre: 'Kevin gagne sur T20 ?',
    apresValider: 'Vainqueur',
    volees: async (services: Services, id: MatchId) =>
      (await services.playCricket.getState(id)).history.length,
  },
  {
    nom: 'Tour du monde',
    demarrer: async (services: Services) =>
      services.playTourDuMonde.start({
        playerIds: await joueurs(services),
        config: TourDuMondeConfig.create({ targets: [20, 'BULL'] }),
      }),
    attendre: () => screen.findByLabelText('Cible de Kevin'),
    poser: async (utilisateur: Utilisateur) => {
      await utilisateur.click(screen.getByRole('button', { name: '20' }))
      await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))
    },
    nombre: 2,
    titre: 'Kevin boucle le parcours sur 25 ?',
    apresValider: 'Dernier tour',
    volees: async (services: Services, id: MatchId) =>
      (await services.playTourDuMonde.getState(id)).history.length,
  },
] as const

describe.each(SORTIES)('$nom : la sortie en attente au rechargement', (mode) => {
  /** Pose la fléchette de sortie, laisse la boîte ouverte, puis démonte (l'app est tuée). */
  const tuerAvecBoite = async () => {
    const utilisateur = userEvent.setup()
    const outils = banc()
    const id = await mode.demarrer(outils.services)
    const vue = ouvrir(outils.services, id)
    await mode.attendre()
    await mode.poser(utilisateur)
    await screen.findByRole('dialog', { name: mode.titre })
    await attendreBrouillon(outils.dependencies, id, mode.nombre)
    vue.unmount()
    return { ...outils, id, utilisateur }
  }

  it('sans entrée d’historique héritée : la boîte revient, rien de dit ; le retour vaut Corriger', async () => {
    const { services, dependencies, dites, id } = await tuerAvecBoite()

    ouvrir(services, id)

    expect(await screen.findByRole('dialog', { name: mode.titre })).toBeInTheDocument()
    expect(locationCourante().state).toMatchObject({ confirmation: 'sortie' })
    expect(dites).toEqual([])
    expect(await mode.volees(services, id)).toBe(0)

    await retourTelephone()

    await waitFor(() => expect(boite()).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${id}`)
    expect(await mode.volees(services, id)).toBe(0)
    expect(dites).toEqual([])
    // Corriger a retiré la fléchette de sortie, au brouillon aussi.
    await attendreBrouillon(dependencies, id, mode.nombre - 1)
  })

  it('avec l’entrée héritée : la boîte revient sans seconde entrée ; Valider écrit et dit', async () => {
    const { services, dependencies, dites, id, utilisateur } = await tuerAvecBoite()

    renderWithServices(<App />, {
      services,
      historique: [
        `/partie/${id}`,
        { pathname: `/partie/${id}`, state: { confirmation: 'sortie' } },
      ],
    })

    expect(await screen.findByRole('dialog', { name: mode.titre })).toBeInTheDocument()
    expect(dites).toEqual([])
    expect(await mode.volees(services, id)).toBe(0)

    await validerSortie(utilisateur)

    expect(await screen.findByText(mode.apresValider)).toBeInTheDocument()
    expect(await mode.volees(services, id)).toBe(1)
    await waitFor(() => expect(dites.length).toBe(1))
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })
})

describe('Volée en cours — brouillon écarté', () => {
  const x01a40 = async (services: Services) =>
    services.startMatch.execute({
      playerIds: await joueurs(services),
      config: X01Config.create({ startingScore: 40, legsToWin: 2 }),
    })

  it('périmé (le journal a avancé) : rien n’est rendu, sans message, et il est effacé', async () => {
    const { services, dependencies, dites } = banc()
    const id = await x01a40(services)
    await dependencies.visitDrafts.save({
      matchId: id,
      visitCount: 3,
      darts: [Dart.single(1)],
    })
    expect(await brouillon(dependencies, id)).not.toBeNull()

    ouvrir(services, id)

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(boite()).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(dites).toEqual([])
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })

  it.each([
    ['une fléchette après la sortie', [Dart.double(20), Dart.single(1)]],
    ['une volée close (trois fléchettes)', [Dart.single(1), Dart.single(1), Dart.single(1)]],
    ['un bust', [Dart.triple(20)]],
  ])('incohérent (%s) : rien n’est rendu, sans message, et il est effacé', async (_, darts) => {
    const { services, dependencies } = banc()
    const id = await x01a40(services)
    await dependencies.visitDrafts.save({ matchId: id, visitCount: 0, darts })
    expect(await brouillon(dependencies, id)).not.toBeNull()

    ouvrir(services, id)

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(boite()).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
    expect(await services.getMatchState.execute(id)).toMatchObject({ history: [] })
  })

  /** Une fléchette qui gagne ou boucle, suivie d'une autre : le préfixe n'est pas une volée ouverte. */
  const PREFIXES_ILLEGAUX = [
    {
      nom: 'Cricket : une fléchette après celle qui gagne',
      demarrer: async (services: Services) =>
        services.playCricket.start({
          playerIds: await joueurs(services),
          config: CricketConfig.create({ targets: [20] }),
        }),
      attendre: () => screen.findByLabelText('Points de Kevin'),
      darts: [Dart.triple(20), Dart.single(1)],
    },
    {
      nom: 'Tour du monde : une fléchette après celle qui boucle',
      demarrer: async (services: Services) =>
        services.playTourDuMonde.start({
          playerIds: await joueurs(services),
          config: TourDuMondeConfig.create({ targets: [20, 'BULL'] }),
        }),
      attendre: () => screen.findByLabelText('Cible de Kevin'),
      darts: [Dart.single(20), Dart.bull(), Dart.single(1)],
    },
  ] as const

  it.each(PREFIXES_ILLEGAUX)(
    '$nom : rien n’est rendu, sans boîte, et il est effacé',
    async (cas) => {
      const { services, dependencies, dites } = banc()
      const id = await cas.demarrer(services)
      await dependencies.visitDrafts.save({ matchId: id, visitCount: 0, darts: [...cas.darts] })
      expect(await brouillon(dependencies, id)).not.toBeNull()

      ouvrir(services, id)
      await cas.attendre()

      expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
      expect(boite()).toBeNull()
      expect(screen.queryByRole('alert')).toBeNull()
      expect(dites).toEqual([])
      await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
    },
  )
})

describe.each(MODES)('$nom : brouillon illisible (la lecture rejette)', (mode) => {
  it('la partie s’ouvre quand même, sans volée en cours, pavé actif, sans spinner sans fin', async () => {
    const { services } = banc({ visitDrafts: new BrouillonsIllisibles() })
    const id = await mode.demarrer(services)

    ouvrir(services, id)
    await mode.attendre()

    expect(screen.queryByText(/Chargement de la partie|Préparation de l’entraînement/)).toBeNull()
    expect(screen.getByRole('button', { name: '20' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('Volée en cours — les règles du mode lèvent en jugeant le brouillon relu (C2)', () => {
  it('la saisie devient prête quand même, sans volée, et le brouillon est effacé', async () => {
    const { services, dependencies } = banc()
    const id = await PAR_MODE.X01.demarrer(services)
    await dependencies.visitDrafts.save({ matchId: id, visitCount: 0, darts: [Dart.single(1)] })
    // Précondition : le brouillon est lisible et cohérent, seul le jugement lève.
    expect(await brouillon(dependencies, id)).not.toBeNull()
    const base = await services.getMatchState.execute(id)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const enveloppe = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <ServicesProvider services={services}>{children}</ServicesProvider>
      </QueryClientProvider>
    )
    const reglesCassees = (): EtatVolee => {
      throw new Error('règle cassée')
    }

    const { result } = renderHook(() => useVoleeEnCours(id, base, reglesCassees), {
      wrapper: enveloppe,
    })

    await waitFor(() => expect(result.current.pret).toBe(true))
    expect(result.current.darts).toEqual([])
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })
})

describe('Volée en cours — brouillon écrit, volée refusée par le journal (N-1)', () => {
  it('volée close : le brouillon reste, puis la reprise l’écarte', async () => {
    const utilisateur = userEvent.setup()
    const matches = new DepotEnPanne()
    const { services, dependencies } = banc({ matches })
    const id = await PAR_MODE.X01.demarrer(services)
    const avant = ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    for (const _ of [0, 1]) await flechette(utilisateur, '1')
    await attendreBrouillon(dependencies, id, 2)
    matches.panne = true
    await flechette(utilisateur, '1')

    expect(await screen.findByRole('alert')).toHaveTextContent('disque plein')
    // L'effacement ne suit que l'enregistrement réussi : les trois fléchettes restent.
    await attendreBrouillon(dependencies, id, 3)
    expect((await services.getMatchState.execute(id)).history).toHaveLength(0)
    avant.unmount()
    matches.panne = false

    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    // Une volée close n'a rien à faire en saisie : écartée, sans message.
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(boite()).toBeNull()
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })

  it.each(GAME_MODE_IDS.filter((id) => id !== 'X01').map((id) => PAR_MODE[id]))(
    '$nom — volée close : le brouillon reste jusqu’à l’échec, puis la reprise l’écarte',
    async (mode) => {
      const utilisateur = userEvent.setup()
      const matches = new DepotEnPanne()
      const { services, dependencies } = banc({ matches })
      const id = await mode.demarrer(services)
      const evenements = async () => (await matches.findById(id))?.events.length ?? 0
      const avant = ouvrir(services, id)
      await mode.attendre()
      const journal = await evenements()

      const [premiere, deuxieme, troisieme] = mode.clore
      await flechette(utilisateur, premiere)
      await flechette(utilisateur, deuxieme)
      await attendreBrouillon(dependencies, id, 2)
      matches.panne = true
      await flechette(utilisateur, troisieme)

      expect(await screen.findByRole('alert')).toHaveTextContent('disque plein')
      // L'effacement ne suit que l'enregistrement réussi : les trois fléchettes restent.
      await attendreBrouillon(dependencies, id, 3)
      expect(await evenements()).toBe(journal)
      avant.unmount()
      matches.panne = false

      ouvrir(services, id)
      await mode.attendre()
      // Une volée close n'a rien à faire en saisie : écartée, sans message.
      await waitFor(() => expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled())
      expect(screen.queryByRole('alert')).toBeNull()
      expect(boite()).toBeNull()
      await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
    },
  )

  it('sortie en attente : le brouillon reste, et la boîte revient au rechargement', async () => {
    const utilisateur = userEvent.setup()
    const matches = new DepotEnPanne()
    const { services, dependencies, dites } = banc({ matches })
    const id = await SORTIES[0].demarrer(services)
    const avant = ouvrir(services, id)
    await SORTIES[0].attendre()
    await SORTIES[0].poser(utilisateur)
    await screen.findByRole('dialog', { name: SORTIES[0].titre })
    await attendreBrouillon(dependencies, id, 2)

    matches.panne = true
    await validerSortie(utilisateur)

    expect(await screen.findByRole('alert')).toHaveTextContent('disque plein')
    await attendreBrouillon(dependencies, id, 2)
    expect(await SORTIES[0].volees(services, id)).toBe(0)
    expect(dites).toEqual([])
    avant.unmount()
    matches.panne = false

    ouvrir(services, id)
    expect(await screen.findByRole('dialog', { name: SORTIES[0].titre })).toBeInTheDocument()
    expect(dites).toEqual([])
    expect(await SORTIES[0].volees(services, id)).toBe(0)

    await validerSortie(utilisateur)
    expect(await screen.findByText(SORTIES[0].apresValider)).toBeInTheDocument()
    expect(await SORTIES[0].volees(services, id)).toBe(1)
    await waitFor(async () => expect(await brouillon(dependencies, id)).toBeNull())
  })
})

describe('Volée en cours — l’écriture du brouillon ne bloque jamais la saisie', () => {
  it('dépôt en panne : la saisie continue, le pavé n’est jamais grisé, aucun message', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc({ visitDrafts: new BrouillonsEnPanne() })
    const id = await PAR_MODE.X01.demarrer(services)
    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    for (const _ of [0, 1, 2]) {
      expect(screen.getByRole('button', { name: '20' })).toBeEnabled()
      await flechette(utilisateur, '20')
    }

    await waitFor(async () =>
      expect((await services.getMatchState.execute(id)).history).toHaveLength(1),
    )
    expect(scoreDe('Kevin')).toHaveTextContent('441')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: '20' })).toBeEnabled()
  })

  it('écritures suspendues : la volée part quand même, et la file finit sur un brouillon vide', async () => {
    const utilisateur = userEvent.setup()
    const visitDrafts = new BrouillonsSuspendus()
    const { services } = banc({ visitDrafts })
    const id = await PAR_MODE.X01.demarrer(services)
    ouvrir(services, id)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    visitDrafts.suspendre()
    for (const _ of [0, 1, 2]) {
      expect(screen.getByRole('button', { name: '1' })).toBeEnabled()
      await flechette(utilisateur, '1')
    }
    await waitFor(async () =>
      expect((await services.getMatchState.execute(id)).history).toHaveLength(1),
    )
    // Une seule écriture a atteint le dépôt : les suivantes attendent leur tour.
    expect(visitDrafts.ecritures).toBe(1)

    visitDrafts.liberer()
    // Trois écritures puis l'effacement, dans l'ordre : le dépôt finit vide.
    await waitFor(() => expect(visitDrafts.ecritures).toBe(4))
    expect(await visitDrafts.findById(id)).toBeNull()
  })
})

describe('Volée en cours — StrictMode', () => {
  it('une seule lecture du brouillon, une seule entrée empilée pour la boîte', async () => {
    const visitDrafts = new BrouillonsSuspendus()
    const { services } = banc({ visitDrafts })
    const id = await SORTIES[0].demarrer(services)
    // Une sortie en attente, laissée par une page tuée : S20 puis D10, à 40.
    await visitDrafts.save({
      matchId: id,
      visitCount: 0,
      darts: [Dart.single(20), Dart.double(10)],
    })
    // La partie déjà en cache (retour par « Reprendre ») : l'état est là dès le
    // montage, c'est donc là que `StrictMode` rejoue l'effet de lecture.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['match', id], await services.getMatchState.execute(id))

    renderWithServices(
      <StrictMode>
        <App />
      </StrictMode>,
      { services, queryClient, historique: ['/', `/partie/${id}`] },
    )

    expect(await screen.findByRole('dialog', { name: 'Kevin sort sur D10 ?' })).toBeInTheDocument()
    expect(visitDrafts.lectures).toBe(1)

    // Un seul recul ferme la boîte (Corriger) ; le suivant quitte la partie.
    await retourTelephone()
    await waitFor(() => expect(boite()).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${id}`)
    expect(scoreDe('Kevin')).toHaveTextContent('20')

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })
})
