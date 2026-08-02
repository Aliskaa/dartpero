import type { MatchState } from '../../domain/services/x01Rules'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchState } from '../ports/driving/GetMatchState'
import { loadMatchState } from './loadMatch'

export class GetMatchStateUseCase implements GetMatchState {
  constructor(private readonly matches: MatchRepository) {}

  execute(matchId: MatchId): Promise<MatchState> {
    return loadMatchState(this.matches, matchId)
  }
}
