import { modeOf } from '../../domain/games'
import type { DatedX01Stats } from '../../domain/games/x01/progress'
import { X01Rules } from '../../domain/games/x01/rules'
import { computeX01Stats } from '../../domain/games/x01/stats'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { StatsPeriod } from '../ports/driving/GetPlayerStats'

const JOURS_EN_ARRIERE: Record<Exclude<StatsPeriod, 'ALL_TIME'>, number> = {
  TODAY: 0,
  LAST_7_DAYS: 6,
  LAST_30_DAYS: 29,
}

// ⚠️ `Date` sert de calendrier, pas d'horloge (l'instant vient de `Clock`) : une journée fait 23 ou 25 h deux fois par an.
const debutDePeriode = (period: StatsPeriod, maintenant: number): number | null => {
  if (period === 'ALL_TIME') return null

  const debut = new Date(maintenant)
  debut.setHours(0, 0, 0, 0)
  debut.setDate(debut.getDate() - JOURS_EN_ARRIERE[period])
  return debut.getTime()
}

/** ⚠️ La seule définition de « la période », partagée par le podium et la carte Évolution. */
export const x01StatsInPeriod = (
  records: readonly MatchRecord[],
  period: StatsPeriod,
  maintenant: number,
): readonly DatedX01Stats[] => {
  const depuis = debutDePeriode(period, maintenant)

  return (
    records
      .filter((record) => modeOf(record.events) === 'X01')
      // ⚠️ Une partie appartient à la soirée où elle a commencé, pas à celle de sa dernière modification.
      .filter((record) => depuis === null || record.createdAt >= depuis)
      .map((record) => ({
        matchId: record.id,
        createdAt: record.createdAt,
        stats: computeX01Stats(X01Rules.project(record.events)),
      }))
  )
}
