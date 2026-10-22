import { computeCareerStats } from '../../domain/games/x01/career'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetPlayerStats, PlayerCareer, StatsPeriod } from '../ports/driving/GetPlayerStats'
import { x01StatsInPeriod } from './x01StatsInPeriod'

export class GetPlayerStatsUseCase implements GetPlayerStats {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
  ) {}

  // Classé sur la moyenne 3 fléchettes ; à égalité, le plus de parties passe devant.
  async execute(period: StatsPeriod = 'ALL_TIME'): Promise<readonly PlayerCareer[]> {
    const [records, profils] = await Promise.all([this.matches.listAll(), this.players.listAll()])

    const stats = x01StatsInPeriod(records, period, this.clock.now()).map((match) => match.stats)

    const carrieres = computeCareerStats(stats)
    const parId = new Map(profils.map((profil) => [profil.id, profil]))

    return carrieres
      .map((carriere) => {
        const profil = parId.get(carriere.playerId)
        return {
          ...carriere,
          name: profil?.name ?? null,
          color: profil?.color ?? null,
        }
      })
      .sort((a, b) => b.average3 - a.average3 || b.matchesPlayed - a.matchesPlayed)
  }
}
