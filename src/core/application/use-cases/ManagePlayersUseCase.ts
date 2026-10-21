import { DomainError } from '../../domain/DomainError'
import { Player } from '../../domain/entities/Player'
import { PlayerId } from '../../domain/value-objects/ids'
import { PlayerColor } from '../../domain/value-objects/PlayerColor'
import type { PlayerGender } from '../../domain/value-objects/PlayerGender'
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
   *
   * Le pseudo est unique (sans tenir compte de la casse) : deux « Diego » à
   * l'oche, c'est deux profils qu'on ne distingue plus à 3 mètres.
   */
  async create(name: string, color?: PlayerColor, gender?: PlayerGender): Promise<Player> {
    const existants = await this.players.listAll()
    const propre = Player.cleanName(name)
    assurerPseudoLibre(propre, existants)
    const couleur = color ?? PlayerColor.nextAvailable(existants.map((joueur) => joueur.color))

    const player = Player.create(
      PlayerId.of(this.ids.newId()),
      propre,
      couleur,
      this.clock.now(),
      gender,
    )
    await this.players.save(player)
    return player
  }

  async update(id: PlayerId, changes: PlayerChanges): Promise<Player> {
    const existant = await this.players.findById(id)
    if (!existant) throw new DomainError(`Unknown player: ${id}`)

    const nom = changes.name !== undefined ? Player.cleanName(changes.name) : existant.name
    if (changes.name !== undefined) {
      assurerPseudoLibre(nom, await this.players.listAll(), id)
    }

    // `createdAt` ne bouge jamais : c'est l'ancienneté du profil, pas sa
    // dernière modification.
    // Genre : absent = inchangé, `null` = « non précisé » (la clé disparaît).
    const genre = changes.gender === undefined ? existant.gender : (changes.gender ?? undefined)
    const modifie = Player.create(
      existant.id,
      nom,
      changes.color ?? existant.color,
      existant.createdAt,
      genre,
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

/** Compare les pseudos comme on les lit à distance : la casse ne compte pas. */
const clePseudo = (nom: string): string => nom.toLocaleLowerCase('fr')

const assurerPseudoLibre = (nom: string, existants: readonly Player[], sauf?: PlayerId): void => {
  const cle = clePseudo(nom)
  const pris = existants.some((joueur) => joueur.id !== sauf && clePseudo(joueur.name) === cle)
  if (pris) throw new DomainError('Player name already taken')
}
