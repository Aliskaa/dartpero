import type { MatchEvent } from '../../../domain/events/MatchEvent'
import type { MatchId } from '../../../domain/value-objects/ids'

/** Le journal et les dates, rien d'autre : le reste se rejoue depuis `events`. */
export type MatchRecord = {
  readonly id: MatchId
  readonly createdAt: number
  readonly updatedAt: number
  readonly events: readonly MatchEvent[]
}

export interface MatchRepository {
  save(record: MatchRecord): Promise<void>
  findById(id: MatchId): Promise<MatchRecord | null>
  /** Les plus récemment touchés d'abord. */
  listRecent(limit?: number): Promise<readonly MatchRecord[]>
  listAll(): Promise<readonly MatchRecord[]>
  delete(id: MatchId): Promise<void>
}
