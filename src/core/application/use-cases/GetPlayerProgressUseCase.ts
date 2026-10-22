import { computeProgress, type PlayerProgress } from '../../domain/games/x01/progress'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetPlayerProgress } from '../ports/driving/GetPlayerProgress'
import type { StatsPeriod } from '../ports/driving/GetPlayerStats'
import { x01StatsInPeriod } from './x01StatsInPeriod'

export class GetPlayerProgressUseCase implements GetPlayerProgress {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Rejouée depuis les journaux, comme le podium et avec le **même** filtre de
   * période : rien n'est stocké, donc la courbe ne peut pas le contredire.
   */
  async execute(period: StatsPeriod = 'ALL_TIME'): Promise<readonly PlayerProgress[]> {
    const records = await this.matches.listAll()
    return computeProgress(x01StatsInPeriod(records, period, this.clock.now()))
  }
}
