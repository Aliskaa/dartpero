import type { GameModeId } from '../../../domain/games'
import type { MatchSummary } from './MatchSummary'

export interface GetMatchHistory {
  /** Les plus récentes d'abord. ⚠️ `mode` filtre avant de couper à `limit`, jamais après. */
  execute(limit?: number, mode?: GameModeId): Promise<readonly MatchSummary[]>
}
