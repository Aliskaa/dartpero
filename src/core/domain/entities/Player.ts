import { DomainError } from '../DomainError'
import type { PlayerId } from '../value-objects/ids'
import type { PlayerColor } from '../value-objects/PlayerColor'
import type { PlayerGender } from '../value-objects/PlayerGender'

// Profil local, sans compte ; `createdAt` vient du port `Clock`.
export type Player = {
  readonly id: PlayerId
  readonly name: string
  readonly color: PlayerColor
  readonly createdAt: number
  /** ⚠️ « Non précisé » = clé absente, jamais `gender: undefined` (IndexedDB garderait la clé). */
  readonly gender?: PlayerGender
}

const LONGUEUR_MAX = 20

export const Player = {
  create(
    id: PlayerId,
    name: string,
    color: PlayerColor,
    createdAt: number,
    gender?: PlayerGender,
  ): Player {
    return {
      id,
      name: Player.cleanName(name),
      color,
      createdAt,
      ...(gender !== undefined ? { gender } : {}),
    }
  },

  cleanName(name: string): string {
    const propre = name.trim().replace(/\s+/g, ' ')
    if (propre === '') throw new DomainError('Player name cannot be empty')
    if (propre.length > LONGUEUR_MAX) {
      throw new DomainError(`Player name cannot exceed ${LONGUEUR_MAX} characters`)
    }
    return propre
  },
}
