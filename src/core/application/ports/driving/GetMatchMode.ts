import type { GameModeId } from '../../../domain/games'
import type { MatchId } from '../../../domain/value-objects/ids'

export interface GetMatchMode {
  execute(matchId: MatchId): Promise<GameModeId>
}
