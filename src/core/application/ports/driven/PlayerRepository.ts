import type { Player } from '../../../domain/entities/Player'
import type { PlayerId } from '../../../domain/value-objects/ids'

export interface PlayerRepository {
  save(player: Player): Promise<void>
  findById(id: PlayerId): Promise<Player | null>
  listAll(): Promise<readonly Player[]>
  delete(id: PlayerId): Promise<void>
}
