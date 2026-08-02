import type { MatchEvent } from '../../../domain/events/MatchEvent'
import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * Ce qui est réellement persisté d'un match : son journal, et rien d'autre.
 *
 * Ni le vainqueur, ni les scores, ni le nombre de legs ne sont stockés — ils se
 * rejouent depuis `events` (voir `X01Rules.project`). Seules les dates ne sont
 * pas déductibles du journal, elles viennent du port `Clock`.
 */
export type MatchRecord = {
  readonly id: MatchId
  readonly createdAt: number
  readonly updatedAt: number
  readonly events: readonly MatchEvent[]
}

export interface MatchRepository {
  save(record: MatchRecord): Promise<void>
  findById(id: MatchId): Promise<MatchRecord | null>
  /** Les matchs les plus récemment touchés d'abord. */
  listRecent(limit?: number): Promise<readonly MatchRecord[]>
  /**
   * Toute la base, sans limite : les statistiques de carrière et la sauvegarde
   * JSON ne peuvent pas se contenter des vingt dernières parties.
   */
  listAll(): Promise<readonly MatchRecord[]>
  delete(id: MatchId): Promise<void>
}
