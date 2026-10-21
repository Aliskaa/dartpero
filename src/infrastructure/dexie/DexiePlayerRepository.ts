import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { Player } from '@/core/domain/entities/Player'
import { PlayerId } from '@/core/domain/value-objects/ids'
import { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import type { DartperoDatabase, StoredPlayer } from './database'

const versPlayer = (stored: StoredPlayer): Player => ({
  id: PlayerId.of(stored.id),
  name: stored.name,
  // La migration v2 remplit la couleur ; ce repli couvre une base écrite par
  // une version encore plus ancienne qui n'aurait pas été migrée.
  color: PlayerColor.of(stored.color ?? 'brique'),
  createdAt: stored.createdAt ?? 0,
  // Clé absente = « non précisé » : on ne l'invente pas à la lecture.
  ...(stored.gender !== undefined ? { gender: PlayerGender.of(stored.gender) } : {}),
})

export class DexiePlayerRepository implements PlayerRepository {
  constructor(private readonly db: DartperoDatabase) {}

  async save(player: Player): Promise<void> {
    // `put` remplace la ligne entière : repasser à « non précisé » retire la clé.
    await this.db.players.put({
      id: player.id,
      name: player.name,
      color: player.color,
      createdAt: player.createdAt,
      ...(player.gender !== undefined ? { gender: player.gender } : {}),
    })
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
