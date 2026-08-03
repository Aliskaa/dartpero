import type { X01State } from '../../../domain/games/x01/rules'
import type { MatchId } from '../../../domain/value-objects/ids'

export interface GetMatchState {
  execute(matchId: MatchId): Promise<X01State>
}
