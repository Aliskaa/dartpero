import { modeOf } from '../../domain/games'
import { computeCareerStats } from '../../domain/games/x01/career'
import { X01Rules } from '../../domain/games/x01/rules'
import { computeX01Stats } from '../../domain/games/x01/stats'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetPlayerStats, PlayerCareer, StatsPeriod } from '../ports/driving/GetPlayerStats'

/** Combien de jours en arrière remonter, minuit local compris. */
const JOURS_EN_ARRIERE: Record<Exclude<StatsPeriod, 'ALL_TIME'>, number> = {
  TODAY: 0,
  LAST_7_DAYS: 6,
  LAST_30_DAYS: 29,
}

/**
 * L'instant à partir duquel une partie compte, ou `null` pour tout prendre.
 *
 * ⚠️ `Date` est utilisée ici comme **calendrier**, jamais comme horloge :
 * l'instant courant vient du port `Clock`. C'est ce qui garde le calcul
 * déterministe en test — la seule chose que `Date` apporte, c'est de savoir où
 * tombe minuit, ce qu'aucune arithmétique en millisecondes ne sait faire
 * correctement (une journée fait 23 ou 25 heures deux fois par an).
 *
 * `setDate` gère ce décalage tout seul, `now - n × 86 400 000` non.
 */
const debutDePeriode = (period: StatsPeriod, maintenant: number): number | null => {
  if (period === 'ALL_TIME') return null

  const debut = new Date(maintenant)
  debut.setHours(0, 0, 0, 0)
  debut.setDate(debut.getDate() - JOURS_EN_ARRIERE[period])
  return debut.getTime()
}

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
   * Le classement se fait sur la **moyenne 3 fléchettes**, la mesure de
   * référence aux fléchettes. À moyenne égale, le plus grand nombre de parties
   * passe devant : une moyenne bâtie sur dix parties vaut mieux qu'un coup de
   * chance sur une seule.
   */
  async execute(period: StatsPeriod = 'ALL_TIME'): Promise<readonly PlayerCareer[]> {
    const [records, profils] = await Promise.all([this.matches.listAll(), this.players.listAll()])

    const depuis = debutDePeriode(period, this.clock.now())

    const stats = records
      // Moyenne 3 fléchettes, 180, pourcentage de doubles : ces mesures n'ont de
      // sens qu'au X01. Une partie de Tour du monde ne les fausserait pas, elle
      // n'y répondrait simplement pas — on l'écarte donc du cumul.
      .filter((record) => modeOf(record.events) === 'X01')
      // ⚠️ Une partie appartient à la soirée où elle a **commencé**, jamais à
      // celle où on l'a touchée en dernier : celle qu'on finit à 00h10 s'est
      // bien jouée ce soir, et la couper en deux ne rendrait service à personne.
      .filter((record) => depuis === null || record.createdAt >= depuis)
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
