import { nameOf } from '../../domain/events/MatchEvent'
import { GameModes } from '../../domain/games'
import { MARKS_TO_CLOSE } from '../../domain/games/cricket/config'
import { KillerRules } from '../../domain/games/killer/rules'
import type { PlayerId } from '../../domain/value-objects/ids'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { MatchSummary } from '../ports/driving/MatchSummary'

export const nameIndex = async (
  players: PlayerRepository,
): Promise<ReadonlyMap<PlayerId, string>> => {
  const all = await players.listAll()
  return new Map(all.map((player) => [player.id, player.name]))
}

export type MatchStatus = 'FINISHED' | 'ONGOING' | 'ABANDONED'

// ⚠️ `ongoingId` est la partie en cours globale (`GetOngoingMatch`, 20 dernières parties), jamais filtrée par mode.
export const matchStatus = (
  summary: Pick<MatchSummary, 'id' | 'finished'>,
  ongoingId: MatchSummary['id'] | null,
): MatchStatus => {
  if (summary.finished) return 'FINISHED'
  return summary.id === ongoingId ? 'ONGOING' : 'ABANDONED'
}

/** Condense un match en rejouant son journal ; les `name` à `null` laissent le libellé à l'UI. */
export const summarize = (
  record: MatchRecord,
  names: ReadonlyMap<PlayerId, string>,
): MatchSummary => {
  const state = GameModes.project(record.events)

  const commun = {
    id: record.id,
    name: nameOf(record.events),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    finished: GameModes.isFinished(state),
    winnerId: state.mode === 'CHECKOUT_PRACTICE' ? null : state.winnerId,
    totalVisits: GameModes.visitCount(state),
  }

  if (state.mode === 'CHECKOUT_PRACTICE') {
    return {
      ...commun,
      mode: 'CHECKOUT_PRACTICE',
      config: state.config,
      players: [{ playerId: state.playerId, name: names.get(state.playerId) ?? null }],
      roundsWon: state.roundsWon,
      roundsPlayed: state.roundsPlayed,
      successPercent: state.successPercent,
    }
  }

  if (state.mode === 'CRICKET') {
    return {
      ...commun,
      mode: 'CRICKET',
      config: state.config,
      targetsTotal: state.config.targets.length,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        closedTargets: player.marks.filter((marks) => marks >= MARKS_TO_CLOSE).length,
        score: player.score,
      })),
    }
  }

  if (state.mode === 'KILLER') {
    const rangs = new Map(KillerRules.ranking(state).map((r) => [r.playerId, r.rank]))
    return {
      ...commun,
      mode: 'KILLER',
      config: state.config,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        number: player.number,
        lives: player.lives,
        killer: player.killer,
        eliminated: player.eliminated,
        rank: rangs.get(player.playerId) ?? state.players.length,
      })),
    }
  }

  if (state.mode === 'TOUR_DU_MONDE') {
    return {
      ...commun,
      mode: 'TOUR_DU_MONDE',
      config: state.config,
      targetsTotal: state.config.targets.length,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        targetIndex: player.targetIndex,
        finishedInDarts: player.finishedInDarts,
      })),
    }
  }

  return {
    ...commun,
    mode: 'X01',
    config: state.config,
    legsPlayed: state.milestones.filter((milestone) => milestone.type === 'LegWon').length,
    players: state.players.map((player) => ({
      playerId: player.playerId,
      name: names.get(player.playerId) ?? null,
      remaining: player.remaining,
      legsWonInSet: player.legsWonInSet,
      setsWon: player.setsWon,
    })),
  }
}
