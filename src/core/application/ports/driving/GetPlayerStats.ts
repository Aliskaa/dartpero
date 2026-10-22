import type { CareerStats } from '../../../domain/games/x01/career'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'

// ⚠️ Des identifiants, pas des libellés : le français vit dans `labels.ts`.
export const STATS_PERIODS = ['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'ALL_TIME'] as const

export type StatsPeriod = (typeof STATS_PERIODS)[number]

/** `name` vaut `null` quand le profil a été supprimé mais que ses parties restent. */
export type PlayerCareer = CareerStats & {
  readonly name: string | null
  readonly color: PlayerColor | null
}

export interface GetPlayerStats {
  /** Les joueurs ayant au moins une partie sur la période, du meilleur au moins bon. */
  execute(period?: StatsPeriod): Promise<readonly PlayerCareer[]>
}
