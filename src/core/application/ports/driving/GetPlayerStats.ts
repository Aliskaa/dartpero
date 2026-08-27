import type { CareerStats } from '../../../domain/games/x01/career'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'

/**
 * La fenêtre de temps sur laquelle les statistiques sont cumulées.
 *
 * ⚠️ Des identifiants, pas des libellés : « Aujourd'hui » se décide dans
 * `labels.ts`, comme tout le français du projet. Le cœur ne fabrique aucun
 * texte affichable (décision du lot 2).
 */
export const STATS_PERIODS = ['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'ALL_TIME'] as const

export type StatsPeriod = (typeof STATS_PERIODS)[number]

/**
 * Les statistiques cumulées d'un joueur, enrichies de son profil — sans quoi
 * l'écran devrait recroiser lui-même les identifiants avec les pseudos.
 *
 * `name` vaut `null` quand le profil a été supprimé mais que ses parties sont
 * toujours là : le cœur ne fabrique pas de libellé français.
 */
export type PlayerCareer = CareerStats & {
  readonly name: string | null
  readonly color: PlayerColor | null
}

export interface GetPlayerStats {
  /**
   * Tous les joueurs ayant au moins une partie sur la période, du meilleur au
   * moins bon. Sans argument : tout depuis toujours, le comportement d'avant.
   */
  execute(period?: StatsPeriod): Promise<readonly PlayerCareer[]>
}
