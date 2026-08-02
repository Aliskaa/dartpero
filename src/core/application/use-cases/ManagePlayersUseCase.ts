import { DomainError } from '../../domain/DomainError'
import { Player } from '../../domain/entities/Player'
import { PlayerId } from '../../domain/value-objects/ids'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { ManagePlayers } from '../ports/driving/ManagePlayers'

export class ManagePlayersUseCase implements ManagePlayers {
  constructor(
    private readonly players: PlayerRepository,
    private readonly ids: IdGenerator,
  ) {}

  async create(name: string): Promise<Player> {
    const player = Player.create(PlayerId.of(this.ids.newId()), name)
    await this.players.save(player)
    return player
  }

  async rename(id: PlayerId, name: string): Promise<Player> {
    const existant = await this.players.findById(id)
    if (!existant) throw new DomainError(`Unknown player: ${id}`)

    const renomme = Player.create(existant.id, name)
    await this.players.save(renomme)
    return renomme
  }

  async remove(id: PlayerId): Promise<void> {
    await this.players.delete(id)
  }

  listAll(): Promise<readonly Player[]> {
    return this.players.listAll()
  }
}
