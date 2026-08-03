import type { X01Stats } from '../../../domain/games/x01/stats'
import type { MatchId } from '../../../domain/value-objects/ids'

export interface GetMatchStats {
  execute(matchId: MatchId): Promise<X01Stats>
}
