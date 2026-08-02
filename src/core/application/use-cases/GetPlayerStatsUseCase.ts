import { computeCareerStats } from '../../domain/services/careerStats'
import { computeMatchStats } from '../../domain/services/matchStats'
import { X01Rules } from '../../domain/services/x01Rules'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetPlayerStats, PlayerCareer } from '../ports/driving/GetPlayerStats'

export class GetPlayerStatsUseCase implements GetPlayerStats {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  /**
   * Tout se rejoue depuis les journaux : aucune statistique n'est stockée, donc
   * aucune ne peut être en désaccord avec les parties.
   *
   * Le classement se fait sur la **moyenne 3 fléchettes**, la mesure de
   * référence aux fléchettes. À moyenne égale, le plus grand nombre de parties
   * passe devant : une moyenne bâtie sur dix parties vaut mieux qu'un coup de
   * chance sur une seule.
   */
  async execute(): Promise<readonly PlayerCareer[]> {
    const [records, profils] = await Promise.all([this.matches.listAll(), this.players.listAll()])

    const stats = records.map((record) => computeMatchStats(X01Rules.project(record.events)))
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
