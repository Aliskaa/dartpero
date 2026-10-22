import type { PlayerProgress } from '../../../domain/games/x01/progress'
import type { StatsPeriod } from './GetPlayerStats'

export interface GetPlayerProgress {
  /** La courbe de chaque joueur, sur les mêmes parties que `GetPlayerStats` ; ni nom ni couleur. */
  execute(period?: StatsPeriod): Promise<readonly PlayerProgress[]>
}
