import type { MatchSummary } from './MatchSummary'

/** Le match en cours le plus récent ; référence de `matchStatus`. */
export interface GetOngoingMatch {
  execute(): Promise<MatchSummary | null>
}
