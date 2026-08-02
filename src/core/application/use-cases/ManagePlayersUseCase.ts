import { DomainError } from '../../domain/DomainError'
import { Player } from '../../domain/entities/Player'
import { PlayerId } from '../../domain/value-objects/ids'
import { PlayerColor } from '../../domain/value-objects/PlayerColor'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { ManagePlayers, PlayerChanges } from '../ports/driving/ManagePlayers'

export class ManagePlayersUseCase implements ManagePlayers {
  constructor(
    private readonly players: PlayerRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  /**
   * Sans couleur choisie, on prend la première encore libre : créer quatre
   * joueurs d'affilée donne quatre couleurs distinctes sans rien demander à
   * personne — « zéro friction au démarrage » est la règle du projet.
   */
  async create(name: string, color?: PlayerColor): Promise<Player> {
    const existants = await this.players.listAll()
    const couleur = color ?? PlayerColor.nextAvailable(existants.map((joueur) => joueur.color))

    const player = Player.create(PlayerId.of(this.ids.newId()), name, couleur, this.clock.now())
    await this.players.save(player)
    return player
  }

  async update(id: PlayerId, changes: PlayerChanges): Promise<Player> {
    const existant = await this.players.findById(id)
    if (!existant) throw new DomainError(`Unknown player: ${id}`)

    // `createdAt` ne bouge jamais : c'est l'ancienneté du profil, pas sa
    // dernière modification.
    const modifie = Player.create(
      existant.id,
      changes.name ?? existant.name,
      changes.color ?? existant.color,
      existant.createdAt,
    )
    await this.players.save(modifie)
    return modifie
  }

  async remove(id: PlayerId): Promise<void> {
    await this.players.delete(id)
  }

  listAll(): Promise<readonly Player[]> {
    return this.players.listAll()
  }
}
