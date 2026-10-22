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

  /**
   * Tout se rejoue depuis les journaux : aucune statistique n'est stockée, donc
   * aucune ne peut être en désaccord avec les parties.
   *
   * Les parties retenues (X01 seul, ouvertes dans la période) viennent de
   * `x01StatsInPeriod`, partagé avec la carte Évolution.
   *
   * Le classement se fait sur la **moyenne 3 fléchettes**, la mesure de
   * référence aux fléchettes. À moyenne égale, le plus grand nombre de parties
   * passe devant : une moyenne bâtie sur dix parties vaut mieux qu'un coup de
   * chance sur une seule.
   */
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
