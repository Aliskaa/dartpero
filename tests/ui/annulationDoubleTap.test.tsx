import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { useCheckoutPractice } from '@/ui/hooks/useCheckoutPractice'
import { useCricket } from '@/ui/hooks/useCricket'
import { PAUSE_ANNULATION_MS } from '@/ui/hooks/usePauseAnnulation'
import { useTourDuMonde } from '@/ui/hooks/useTourDuMonde'
import { useX01 } from '@/ui/hooks/useX01'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import { DepotSuspendu, fakeServices, SettableClock } from '../fakes'
import { flechette } from './gestes'
import { renderWithServices } from './renderWithServices'

/**
 * Le double appui réflexe sur « Annuler T20 » : le premier retire la dernière
 * fléchette, le second ne doit PAS défaire la volée d'un autre joueur.
 *
 * Les quatre modes partagent la règle (`usePauseAnnulation`) : chaque test
 * tourne donc mode par mode (`it.each`), pour qu'un hook oublié se voie.
 * Le temps est celui de `SettableClock`, jamais celui de la machine.
 */

type Saisie = {
  readonly state: unknown
  readonly ajouterFlechette: (dart: Dart) => void
  readonly annuler: () => Promise<void>
  readonly peutAnnuler: boolean
  readonly occupe: boolean
  readonly dartsEnCours: readonly Dart[]
}

type Mode = {
  /** Une partie où une volée (ou manche) est déjà enregistrée. */
  readonly preparer: (services: Services) => Promise<MatchId>
  /** Combien de volées (manches à l'entraînement) le journal compte. */
  readonly enregistrees: (services: Services, matchId: MatchId) => Promise<number>
  /** Le bouton du pavé qui saisit une fléchette sans rien conclure. */
  readonly bouton: string
  readonly hook: (matchId: MatchId) => Saisie
}

const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

/** Une entrée par mode : TypeScript refuse la table si un 5ᵉ mode manque. */
const MODES: Record<GameModeId, Mode> = {
  X01: {
    preparer: async (services) => {
      const kevin = await services.managePlayers.create('Kevin')
      const julien = await services.managePlayers.create('Julien')
      const matchId = await services.startMatch.execute({
        playerIds: [kevin.id, julien.id],
        config: X01Config.create(),
      })
      await services.recordVisit.execute({ matchId, darts: RATE })
      return matchId
    },
    enregistrees: async (services, matchId) =>
      (await services.getMatchState.execute(matchId)).history.length,
    bouton: '1',
    hook: useX01,
  },
  CRICKET: {
    preparer: async (services) => {
      const kevin = await services.managePlayers.create('Kevin')
      const julien = await services.managePlayers.create('Julien')
      const matchId = await services.playCricket.start({
        playerIds: [kevin.id, julien.id],
        config: CricketConfig.create(),
      })
      await services.playCricket.recordVisit(matchId, RATE)
      return matchId
    },
    enregistrees: async (services, matchId) =>
      (await services.playCricket.getState(matchId)).history.length,
    bouton: '20',
    hook: useCricket,
  },
  TOUR_DU_MONDE: {
    preparer: async (services) => {
      const kevin = await services.managePlayers.create('Kevin')
      const julien = await services.managePlayers.create('Julien')
      const matchId = await services.playTourDuMonde.start({
        playerIds: [kevin.id, julien.id],
        config: TourDuMondeConfig.create(),
      })
      await services.playTourDuMonde.recordVisit(matchId, RATE)
      return matchId
    },
    enregistrees: async (services, matchId) =>
      (await services.playTourDuMonde.getState(matchId)).history.length,
    bouton: '20',
    hook: useTourDuMonde,
  },
  CHECKOUT_PRACTICE: {
    preparer: async (services) => {
      const kevin = await services.managePlayers.create('Kevin')
      const matchId = await services.playCheckoutPractice.start({
        playerId: kevin.id,
        config: CheckoutPracticeConfig.create({ rounds: 3 }),
      })
      await services.playCheckoutPractice.recordVisit(matchId, RATE)
      return matchId
    },
    enregistrees: async (services, matchId) =>
      (await services.playCheckoutPractice.getState(matchId)).roundsPlayed,
    bouton: '1',
    hook: useCheckoutPractice,
  },
}

/** Des services dont l'horloge ne bouge que si le test la déplace. */
const servicesFiges = () => {
  const clock = new SettableClock()
  return { clock, services: fakeServices({ clock }).services }
}

const annuler = () => screen.getByRole('button', { name: /^Annuler/ })

/** Le pavé est prêt quand l'annulation de la volée enregistrée est disponible. */
const attendrePret = () => waitFor(() => expect(annuler()).toBeEnabled())

const rendreEcran = async (mode: Mode) => {
  const { clock, services } = servicesFiges()
  const matchId = await mode.preparer(services)
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })
  await attendrePret()
  return { clock, services, matchId }
}

describe.each(GAME_MODE_IDS)('Annuler, double appui — %s (écran)', (modeId) => {
  const mode = MODES[modeId]

  it('critère 1 : deux appuis rapides retirent la fléchette sans toucher à la volée précédente', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await rendreEcran(mode)

    await flechette(utilisateur, mode.bouton)
    await utilisateur.click(annuler())
    await utilisateur.click(annuler())

    expect(await mode.enregistrees(services, matchId)).toBe(1)
    expect(annuler()).toBeDisabled()
  })

  it('critère 2 : après la pause, un appui rouvre la volée enregistrée, une fléchette en moins', async () => {
    const utilisateur = userEvent.setup()
    const { clock, services, matchId } = await rendreEcran(mode)

    await flechette(utilisateur, mode.bouton)
    await utilisateur.click(annuler())
    expect(annuler()).toBeDisabled()

    clock.regler(clock.now() + PAUSE_ANNULATION_MS)
    // Le minuteur d'affichage tourne en temps réel : il ne fait que réactiver le bouton.
    await waitFor(() => expect(annuler()).toBeEnabled(), { timeout: 3000 })
    await utilisateur.click(annuler())

    // Lot `annulation-volee` : la volée quitte le journal, ses deux premières
    // fléchettes reviennent en saisie (« Annuler 0 »).
    await waitFor(async () => expect(await mode.enregistrees(services, matchId)).toBe(0))
    await waitFor(() => expect(annuler()).toHaveTextContent('Annuler 0'))
  }, 10_000)

  it('critère 3 : deux fléchettes en cours, deux appuis les retirent sans pause', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await rendreEcran(mode)

    await flechette(utilisateur, mode.bouton)
    await flechette(utilisateur, mode.bouton)

    await utilisateur.click(annuler())
    expect(annuler()).toBeEnabled()
    await utilisateur.click(annuler())

    // Les deux fléchettes sont parties ; la volée enregistrée est intacte.
    expect(annuler()).toBeDisabled()
    expect(await mode.enregistrees(services, matchId)).toBe(1)
  })

  it('critère 4 : sans fléchette en cours, un seul appui rouvre la volée précédente', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await rendreEcran(mode)

    await utilisateur.click(annuler())

    await waitFor(async () => expect(await mode.enregistrees(services, matchId)).toBe(0))
    // Une fléchette retirée, pas trois : il en reste deux à retirer.
    await waitFor(() => expect(annuler()).toHaveTextContent('Annuler 0'))
    expect(annuler()).toBeEnabled()
  })
})

describe('Annuler, double appui — X01, manche gagnée', () => {
  it('critère 2 : la volée qui avait gagné une manche est défaite après la pause', async () => {
    const utilisateur = userEvent.setup()
    const { clock, services } = servicesFiges()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 2, doubleOut: true }),
    })
    // Kevin sort sur D20 : première manche, la main passe à Julien.
    await services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await attendrePret()

    await flechette(utilisateur, '1')
    await utilisateur.click(annuler())
    // Pendant la pause, un second appui ne défait pas la manche gagnée.
    await utilisateur.click(annuler())
    const pendant = await services.getMatchState.execute(matchId)
    expect(pendant.history).toHaveLength(1)
    // La manche reste gagnée : Kevin a 1 manche, on est à la 2ᵉ manche.
    expect(pendant.legNumber).toBe(1)
    expect(pendant.players[0]?.legsWonInSet).toBe(1)

    clock.regler(clock.now() + PAUSE_ANNULATION_MS)
    await waitFor(() => expect(annuler()).toBeEnabled(), { timeout: 3000 })
    await utilisateur.click(annuler())

    await waitFor(async () =>
      expect((await services.getMatchState.execute(matchId)).history).toHaveLength(0),
    )
    // Manche défaite : reste revenu à 40, aucune manche gagnée, retour à la 1re manche.
    const apres = await services.getMatchState.execute(matchId)
    expect(apres.players[0]?.remaining).toBe(40)
    expect(apres.players[0]?.legsWonInSet).toBe(0)
    expect(apres.legNumber).toBe(0)
  }, 10_000)
})

const enveloppe = (services: Services) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ServicesProvider services={services}>{children}</ServicesProvider>
    </QueryClientProvider>
  )
}

const laisserPasser = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

describe.each(GAME_MODE_IDS)('Annuler, double appui — %s (hook)', (modeId) => {
  const mode = MODES[modeId]

  it('critère 1 : la garde lit l’horloge, pas le bouton — deux annuler() de suite', async () => {
    const { clock, services } = servicesFiges()
    const matchId = await mode.preparer(services)
    const { result } = renderHook(() => mode.hook(matchId), { wrapper: enveloppe(services) })
    await waitFor(() => expect(result.current.state).not.toBeNull())

    act(() => result.current.ajouterFlechette(Dart.single(1)))
    await act(() => result.current.annuler())
    expect(result.current.peutAnnuler).toBe(false)

    // Même instant : la volée enregistrée reste.
    await act(() => result.current.annuler())
    expect(await mode.enregistrees(services, matchId)).toBe(1)

    clock.regler(clock.now() + PAUSE_ANNULATION_MS)
    await act(() => result.current.annuler())
    expect(await mode.enregistrees(services, matchId)).toBe(0)
    // La volée rouverte rend ses deux premières fléchettes à la saisie.
    expect(result.current.dartsEnCours).toHaveLength(2)
  })

  it('critère 5 : pendant une écriture en cours, annuler() ne lance aucune annulation', async () => {
    const depot = new DepotSuspendu()
    const clock = new SettableClock()
    const { services } = fakeServices({ matches: depot, clock })
    const matchId = await mode.preparer(services)
    const { result } = renderHook(() => mode.hook(matchId), { wrapper: enveloppe(services) })
    await waitFor(() => expect(result.current.state).not.toBeNull())

    depot.ecritures = 0
    depot.suspendre()

    // Première annulation : l'écriture démarre et reste suspendue.
    act(() => {
      void result.current.annuler()
    })
    await waitFor(() => expect(result.current.occupe).toBe(true))
    await laisserPasser()
    expect(depot.ecritures).toBe(1)

    // Seconde annulation pendant l'écriture : aucune écriture de plus.
    act(() => {
      void result.current.annuler()
    })
    await laisserPasser()
    expect(depot.ecritures).toBe(1)

    depot.liberer()
    await waitFor(() => expect(result.current.occupe).toBe(false))
    expect(depot.ecritures).toBe(1)
  })
})
