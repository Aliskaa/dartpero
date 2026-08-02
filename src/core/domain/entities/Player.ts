import { DomainError } from '../DomainError'
import type { PlayerId } from '../value-objects/ids'
import type { PlayerColor } from '../value-objects/PlayerColor'

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
}

/** Un pseudo lu à 3 mètres dans une liste : au-delà, c'est tronqué de toute façon. */
const LONGUEUR_MAX = 20

export const Player = {
  create(id: PlayerId, name: string, color: PlayerColor, createdAt: number): Player {
    return { id, name: Player.cleanName(name), color, createdAt }
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
