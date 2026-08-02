import { DomainError } from '../DomainError'
import type { PlayerId } from '../value-objects/ids'

/**
 * Un joueur est un profil **local** : pas de compte, pas de mot de passe.
 * La couleur et la date de création arrivent au lot 4 (écran Joueurs) ; les
 * règles du jeu n'ont besoin que de l'identité.
 */
export type Player = {
  readonly id: PlayerId
  readonly name: string
}

export const Player = {
  create(id: PlayerId, name: string): Player {
    const propre = name.trim()
    if (propre === '') throw new DomainError('Player name cannot be empty')
    return { id, name: propre }
  },
}
