import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { Player } from '@/core/domain/entities/Player'
import { PlayerId } from '@/core/domain/value-objects/ids'
import type { DartperoDatabase, StoredPlayer } from './database'

const versPlayer = (stored: StoredPlayer): Player => ({
  id: PlayerId.of(stored.id),
  name: stored.name,
})

export class DexiePlayerRepository implements PlayerRepository {
  constructor(private readonly db: DartperoDatabase) {}

  async save(player: Player): Promise<void> {
    await this.db.players.put({ id: player.id, name: player.name })
  }

  async findById(id: PlayerId): Promise<Player | null> {
    const stored = await this.db.players.get(id)
    return stored ? versPlayer(stored) : null
  }

  async listAll(): Promise<readonly Player[]> {
    const stored = await this.db.players.orderBy('name').toArray()
    return stored.map(versPlayer)
  }

  async delete(id: PlayerId): Promise<void> {
    await this.db.players.delete(id)
  }
}
