import { DomainError } from '../DomainError'

// Teintes symboliques (le rendu est à l'UI), ensemble fermé pour se distinguer à 3 mètres.
export const PLAYER_COLORS = [
  'brique',
  'sapin',
  'lagon',
  'prune',
  'cuivre',
  'turquoise',
  'grenat',
  'olive',
] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]

export const PlayerColor = {
  of(valeur: string): PlayerColor {
    const couleur = PLAYER_COLORS.find((connue) => connue === valeur)
    if (!couleur) throw new DomainError(`Unknown player color: ${valeur}`)
    return couleur
  },

  /** Première teinte libre, sinon la suivante du cycle. */
  nextAvailable(prises: readonly PlayerColor[]): PlayerColor {
    const libre = PLAYER_COLORS.find((couleur) => !prises.includes(couleur))
    return libre ?? (PLAYER_COLORS[prises.length % PLAYER_COLORS.length] as PlayerColor)
  },
}
