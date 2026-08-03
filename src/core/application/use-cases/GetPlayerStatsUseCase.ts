import { modeOf } from '../../domain/games'
import { computeCareerStats } from '../../domain/games/x01/career'
import { X01Rules } from '../../domain/games/x01/rules'
import { computeX01Stats } from '../../domain/games/x01/stats'
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

    // Moyenne 3 fléchettes, 180, pourcentage de doubles : ces mesures n'ont de
    // sens qu'au X01. Une partie de Tour du monde ne les fausserait pas, elle
    // n'y répondrait simplement pas — on l'écarte donc du cumul.
    const stats = records
      .filter((record) => modeOf(record.events) === 'X01')
      .map((record) => computeX01Stats(X01Rules.project(record.events)))
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
