import type { MatchSummary } from './MatchSummary'

/**
 * Le match en cours le plus récent, s'il y en a un. Alimente le bouton
 * « Reprendre la partie » de l'accueil, et sert de référence à `matchStatus` :
 * toute autre partie non terminée est « Abandonnée ».
 */
export interface GetOngoingMatch {
  execute(): Promise<MatchSummary | null>
}
