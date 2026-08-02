import type { MatchSummary } from './MatchSummary'

export interface GetMatchHistory {
  execute(limit?: number): Promise<readonly MatchSummary[]>
}
