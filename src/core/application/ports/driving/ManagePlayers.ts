import type { Player } from '../../../domain/entities/Player'
import type { PlayerId } from '../../../domain/value-objects/ids'

/**
 * Les joueurs sont des profils **locaux** : pas de compte, pas de mot de passe.
 * On en crée un en tapant un pseudo.
 */
export interface ManagePlayers {
  create(name: string): Promise<Player>
  rename(id: PlayerId, name: string): Promise<Player>
  remove(id: PlayerId): Promise<void>
  listAll(): Promise<readonly Player[]>
}
