import type { CareerStats } from '../../../domain/services/careerStats'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'

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
  /** Tous les joueurs ayant au moins une partie, du meilleur au moins bon. */
  execute(): Promise<readonly PlayerCareer[]>
}
