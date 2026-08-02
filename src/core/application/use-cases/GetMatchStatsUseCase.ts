import { computeMatchStats, type MatchStats } from '../../domain/services/matchStats'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchStats } from '../ports/driving/GetMatchStats'
import { loadMatchState } from './loadMatch'

export class GetMatchStatsUseCase implements GetMatchStats {
  constructor(private readonly matches: MatchRepository) {}

  async execute(matchId: MatchId): Promise<MatchStats> {
    return computeMatchStats(await loadMatchState(this.matches, matchId))
  }
}
