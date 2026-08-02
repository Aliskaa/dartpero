import type { MatchState } from '../../../domain/services/x01Rules'
import type { MatchId } from '../../../domain/value-objects/ids'

export interface GetMatchState {
  execute(matchId: MatchId): Promise<MatchState>
}
