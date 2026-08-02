import { X01Rules } from '../../domain/services/x01Rules'
import type { PlayerId } from '../../domain/value-objects/ids'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { MatchSummary } from '../ports/driving/MatchSummary'

/** Index pseudo par identifiant, pour éviter une lecture par joueur et par match. */
export const nameIndex = async (
  players: PlayerRepository,
): Promise<ReadonlyMap<PlayerId, string>> => {
  const all = await players.listAll()
  return new Map(all.map((player) => [player.id, player.name]))
}

/**
 * Condense un match en rejouant son journal.
 *
 * `name` vaut `null` quand le profil local a été supprimé depuis : c'est à
 * l'UI de choisir comment l'afficher, le cœur ne connaît pas le français.
 */
export const summarize = (
  record: MatchRecord,
  names: ReadonlyMap<PlayerId, string>,
): MatchSummary => {
  const state = X01Rules.project(record.events)

  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    config: state.config,
    finished: X01Rules.isFinished(state),
    winnerId: state.winnerId,
    totalVisits: state.history.length,
    players: state.players.map((player) => ({
      playerId: player.playerId,
      name: names.get(player.playerId) ?? null,
      remaining: player.remaining,
      legsWonInSet: player.legsWonInSet,
      setsWon: player.setsWon,
    })),
  }
}
