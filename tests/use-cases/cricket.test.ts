import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { CricketSummary } from '@/core/application/ports/driving/MatchSummary'
import { DomainError } from '@/core/domain/DomainError'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/** Trois cibles : une partie complète tient en quelques volées. */
const COURT = CricketConfig.create({ targets: [20, 19, 'BULL'] })
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Cricket (use case)', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
  })

  const demarrer = (config = COURT) =>
    services.playCricket.start({ playerIds: [kevin, julien], config })

  it('ouvre une partie où tout est à fermer', async () => {
    const state = await services.playCricket.getState(await demarrer())

    expect(state.mode).toBe('CRICKET')
    expect(state.players).toHaveLength(2)
    expect(state.players[0]?.marks).toEqual([0, 0, 0])
    expect(state.finished).toBe(false)
  })

  /** Le test qui compte : une partie jouée de bout en bout à travers les ports. */
  it('se joue jusqu’au bout et désigne un vainqueur', async () => {
    const id = await demarrer()

    await services.playCricket.recordVisit(id, [Dart.triple(20), Dart.triple(20)])
    await services.playCricket.recordVisit(id, RATE)
    await services.playCricket.recordVisit(id, [Dart.triple(19)])
    await services.playCricket.recordVisit(id, RATE)
    const fin = await services.playCricket.recordVisit(id, [Dart.bullseye(), Dart.bull()])

    expect(fin.state.finished).toBe(true)
    expect(fin.state.winnerId).toBe(kevin)
    expect(fin.state.players[0]?.score).toBe(60)
    expect(fin.milestones.at(-1)).toEqual({ type: 'MatchFinished', winnerId: kevin })
  })

  it('remonte ce que la volée vient de produire', async () => {
    const id = await demarrer()
    const resultat = await services.playCricket.recordVisit(id, [Dart.triple(20), Dart.single(20)])

    expect(resultat.visit.marks).toBe(3)
    expect(resultat.visit.points).toBe(20)
    expect(resultat.milestones).toEqual([{ type: 'TargetClosed', playerId: kevin, target: 20 }])
  })

  it('n’écrit rien quand la volée est refusée', async () => {
    const id = await demarrer()

    await expect(services.playCricket.recordVisit(id, [])).rejects.toThrow(DomainError)

    const state = await services.playCricket.getState(id)
    expect(state.history).toHaveLength(0)
  })

  it('annule la dernière volée en revenant exactement à l’état d’avant', async () => {
    const id = await demarrer()
    await services.playCricket.recordVisit(id, [Dart.triple(20), Dart.triple(20)])

    const { state: revenu } = await services.playCricket.undoLastVisit(id)

    expect(revenu.players[0]?.marks).toEqual([0, 0, 0])
    expect(revenu.players[0]?.score).toBe(0)
    await expect(services.playCricket.undoLastVisit(id)).rejects.toThrow(DomainError)
  })

  it('refuse de démarrer avec un joueur inconnu', async () => {
    await expect(
      services.playCricket.start({ playerIds: [kevin, 'fantome' as PlayerId], config: COURT }),
    ).rejects.toThrow(DomainError)
  })

  it('rejoue une partie cut-throat avec sa variante intacte', async () => {
    const id = await demarrer(
      CricketConfig.create({ targets: [20, 19, 'BULL'], variant: 'CUT_THROAT' }),
    )
    await services.playCricket.recordVisit(id, [Dart.triple(20), Dart.triple(20)])

    const state = await services.playCricket.getState(id)
    expect(state.config.variant).toBe('CUT_THROAT')
    expect(state.players[0]?.score).toBe(0)
    expect(state.players[1]?.score).toBe(60)
  })

  it('apparaît dans l’historique sans fausser les statistiques X01', async () => {
    const id = await demarrer()
    await services.playCricket.recordVisit(id, [Dart.triple(20), Dart.single(20)])

    const historique = await services.getMatchHistory.execute()
    expect(historique).toHaveLength(1)

    const partie = historique[0] as CricketSummary
    expect(partie.mode).toBe('CRICKET')
    expect(partie.targetsTotal).toBe(3)
    expect(partie.players[0]?.closedTargets).toBe(1)
    expect(partie.players[0]?.score).toBe(20)

    expect(await services.getPlayerStats.execute()).toEqual([])
  })

  it('se reprend depuis l’accueil comme n’importe quelle partie en cours', async () => {
    const id = await demarrer()
    await services.playCricket.recordVisit(id, RATE)

    const enCours = await services.getOngoingMatch.execute()
    expect(enCours?.id).toBe(id)
    expect(enCours?.mode).toBe('CRICKET')
    expect(await services.getMatchMode.execute(id)).toBe('CRICKET')
  })
})
