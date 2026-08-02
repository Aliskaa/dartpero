import { DomainError } from '../DomainError'

/**
 * La couleur d'un profil, en teintes **symboliques**.
 *
 * Le cœur ne connaît pas le rendu : pas de `#C1272D` ici, seulement un nom. La
 * traduction en pixels appartient à l'UI, qui pourra changer de charte sans
 * qu'on touche à une seule donnée persistée.
 *
 * Ensemble **fermé** : deux joueurs se distinguent d'un coup d'œil à 3 mètres,
 * ce qui n'arrive pas avec un sélecteur de couleur libre où l'on choisit deux
 * bleus voisins.
 */
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

  /**
   * La première teinte encore libre, sinon la suivante dans l'ordre du cycle.
   * Créer quatre joueurs d'affilée donne quatre couleurs distinctes sans que
   * personne n'ait eu à choisir.
   */
  nextAvailable(prises: readonly PlayerColor[]): PlayerColor {
    const libre = PLAYER_COLORS.find((couleur) => !prises.includes(couleur))
    return libre ?? (PLAYER_COLORS[prises.length % PLAYER_COLORS.length] as PlayerColor)
  },
}
