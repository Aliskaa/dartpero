import { computeX01Stats, type X01Stats } from '../../domain/games/x01/stats'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchStats } from '../ports/driving/GetMatchStats'
import { loadMatchState } from './loadMatch'

export class GetMatchStatsUseCase implements GetMatchStats {
  constructor(private readonly matches: MatchRepository) {}

  async execute(matchId: MatchId): Promise<X01Stats> {
    return computeX01Stats(await loadMatchState(this.matches, matchId))
  }
}
