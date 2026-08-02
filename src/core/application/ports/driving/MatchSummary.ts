import type { X01Config } from '../../../domain/entities/Match'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type MatchSummaryPlayer = {
  readonly playerId: PlayerId
  /** `null` si le profil local a été supprimé depuis. L'UI décide du libellé. */
  readonly name: string | null
  readonly remaining: number
  readonly legsWonInSet: number
  readonly setsWon: number
}

/**
 * Vue condensée d'un match, pour l'accueil (« reprendre la partie ») et
 * l'historique. Entièrement dérivée du journal : rien de tout ceci n'est stocké.
 */
export type MatchSummary = {
  readonly id: MatchId
  readonly createdAt: number
  readonly updatedAt: number
  readonly config: X01Config
  readonly players: readonly MatchSummaryPlayer[]
  readonly finished: boolean
  readonly winnerId: PlayerId | null
  readonly totalVisits: number
}
