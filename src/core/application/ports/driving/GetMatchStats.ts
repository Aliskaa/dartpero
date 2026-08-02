import type { MatchStats } from '../../../domain/services/matchStats'
import type { MatchId } from '../../../domain/value-objects/ids'

export interface GetMatchStats {
  execute(matchId: MatchId): Promise<MatchStats>
}
