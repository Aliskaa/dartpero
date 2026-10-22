import type { MatchId } from '../../../domain/value-objects/ids'

export interface DeleteMatch {
  execute(matchId: MatchId): Promise<void>
}
