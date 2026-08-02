import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly players = new Map<PlayerId, Player>()

  async save(player: Player): Promise<void> {
    this.players.set(player.id, player)
  }

  async findById(id: PlayerId): Promise<Player | null> {
    return this.players.get(id) ?? null
  }

  async listAll(): Promise<readonly Player[]> {
    return [...this.players.values()]
  }

  async delete(id: PlayerId): Promise<void> {
    this.players.delete(id)
  }
}
