import type { X01State } from '../../domain/games/x01/rules'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchState } from '../ports/driving/GetMatchState'
import { loadMatchState } from './loadMatch'

export class GetMatchStateUseCase implements GetMatchState {
  constructor(private readonly matches: MatchRepository) {}

  execute(matchId: MatchId): Promise<X01State> {
    return loadMatchState(this.matches, matchId)
  }
}
