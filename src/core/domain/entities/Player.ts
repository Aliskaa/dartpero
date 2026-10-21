import { DomainError } from '../DomainError'
import type { PlayerId } from '../value-objects/ids'
import type { PlayerColor } from '../value-objects/PlayerColor'
import type { PlayerGender } from '../value-objects/PlayerGender'

/**
 * Un joueur est un profil **local** : pas de compte, pas de mot de passe.
 * Un pseudo, une couleur, une date de création — et ses parties le suivent sur
 * cet appareil.
 *
 * `createdAt` vient du port `Clock`, jamais de `Date.now()` : le domaine reste
 * déterministe et testable.
 */
export type Player = {
  readonly id: PlayerId
  readonly name: string
  readonly color: PlayerColor
  readonly createdAt: number
  /**
   * Facultatif (lot `killer`) : sert seulement à accorder « éliminé /
   * éliminée » au Killer. ⚠️ « Non précisé » = **clé absente**, jamais
   * `gender: undefined` (le clonage d'IndexedDB garderait la clé).
   */
  readonly gender?: PlayerGender
}

/** Un pseudo lu à 3 mètres dans une liste : au-delà, c'est tronqué de toute façon. */
const LONGUEUR_MAX = 20

export const Player = {
  create(
    id: PlayerId,
    name: string,
    color: PlayerColor,
    createdAt: number,
    gender?: PlayerGender,
  ): Player {
    // Étalement conditionnel : sans genre, la clé n'existe pas.
    return {
      id,
      name: Player.cleanName(name),
      color,
      createdAt,
      ...(gender !== undefined ? { gender } : {}),
    }
  },

  /** Seul point de validation du pseudo : appelé à la création comme au renommage. */
  cleanName(name: string): string {
    const propre = name.trim().replace(/\s+/g, ' ')
    if (propre === '') throw new DomainError('Player name cannot be empty')
    if (propre.length > LONGUEUR_MAX) {
      throw new DomainError(`Player name cannot exceed ${LONGUEUR_MAX} characters`)
    }
    return propre
  },
}
