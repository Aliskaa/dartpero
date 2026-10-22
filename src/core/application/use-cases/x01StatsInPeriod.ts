import { modeOf } from '../../domain/games'
import type { DatedX01Stats } from '../../domain/games/x01/progress'
import { X01Rules } from '../../domain/games/x01/rules'
import { computeX01Stats } from '../../domain/games/x01/stats'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { StatsPeriod } from '../ports/driving/GetPlayerStats'

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

/**
 * Les parties X01 de la période, projetées en statistiques et datées.
 *
 * ⚠️ La **seule** définition de « la période » : le podium (`GetPlayerStats`)
 * et la carte Évolution (`GetPlayerProgress`) la partagent, pour qu'ils parlent
 * toujours des mêmes parties. L'ordre de sortie est celui de l'entrée : qui a
 * besoin d'un ordre le pose lui-même.
 */
export const x01StatsInPeriod = (
  records: readonly MatchRecord[],
  period: StatsPeriod,
  maintenant: number,
): readonly DatedX01Stats[] => {
  const depuis = debutDePeriode(period, maintenant)

  return (
    records
      // Moyenne 3 fléchettes, 180, pourcentage de doubles : ces mesures n'ont de
      // sens qu'au X01. Une partie de Tour du monde ne les fausserait pas, elle
      // n'y répondrait simplement pas — on l'écarte donc du cumul.
      .filter((record) => modeOf(record.events) === 'X01')
      // ⚠️ Une partie appartient à la soirée où elle a **commencé**, jamais à
      // celle où on l'a touchée en dernier : celle qu'on finit à 00h10 s'est
      // bien jouée ce soir, et la couper en deux ne rendrait service à personne.
      .filter((record) => depuis === null || record.createdAt >= depuis)
      .map((record) => ({
        matchId: record.id,
        createdAt: record.createdAt,
        stats: computeX01Stats(X01Rules.project(record.events)),
      }))
  )
}
