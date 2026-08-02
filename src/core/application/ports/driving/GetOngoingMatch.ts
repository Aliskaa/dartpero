import type { MatchSummary } from './MatchSummary'

/**
 * Le match en cours le plus récent, s'il y en a un. Alimente le bouton
 * « Reprendre la partie » de l'accueil.
 */
export interface GetOngoingMatch {
  execute(): Promise<MatchSummary | null>
}
