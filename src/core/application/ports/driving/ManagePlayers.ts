import type { Player } from '../../../domain/entities/Player'
import type { PlayerId } from '../../../domain/value-objects/ids'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'
import type { PlayerGender } from '../../../domain/value-objects/PlayerGender'

export type PlayerChanges = {
  readonly name?: string
  readonly color?: PlayerColor
  /** Absent = inchangé ; `null` = repasser à « non précisé » (la clé disparaît). */
  readonly gender?: PlayerGender | null
}

export interface ManagePlayers {
  /** Sans genre, le profil est « non précisé » : la clé est absente. */
  create(name: string, color?: PlayerColor, gender?: PlayerGender): Promise<Player>
  update(id: PlayerId, changes: PlayerChanges): Promise<Player>
  remove(id: PlayerId): Promise<void>
  listAll(): Promise<readonly Player[]>
}
