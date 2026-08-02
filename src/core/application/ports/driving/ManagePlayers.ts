import type { Player } from '../../../domain/entities/Player'
import type { PlayerId } from '../../../domain/value-objects/ids'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'

/** Ce qu'on peut changer sur un profil. Tout est optionnel : on modifie ce qu'on touche. */
export type PlayerChanges = {
  readonly name?: string
  readonly color?: PlayerColor
}

/**
 * Les joueurs sont des profils **locaux** : pas de compte, pas de mot de passe.
 * On en crée un en tapant un pseudo — la couleur est attribuée toute seule si
 * on n'en choisit pas.
 */
export interface ManagePlayers {
  create(name: string, color?: PlayerColor): Promise<Player>
  update(id: PlayerId, changes: PlayerChanges): Promise<Player>
  remove(id: PlayerId): Promise<void>
  listAll(): Promise<readonly Player[]>
}
