import type { PlayerProgress } from '../../../domain/games/x01/progress'
import type { StatsPeriod } from './GetPlayerStats'

export interface GetPlayerProgress {
  /**
   * La courbe X01 de chaque joueur ayant au moins une partie avec fléchette sur
   * la période — les mêmes parties que `GetPlayerStats`. Sans argument : tout
   * depuis toujours.
   *
   * Tous les joueurs d'un coup : changer de joueur à l'écran ne relit rien.
   * Ni nom ni couleur : l'écran les a déjà dans le `PlayerCareer` choisi.
   */
  execute(period?: StatsPeriod): Promise<readonly PlayerProgress[]>
}
