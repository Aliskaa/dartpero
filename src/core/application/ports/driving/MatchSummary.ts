import type { X01Config } from '../../../domain/entities/Match'
import type { TourDuMondeConfig } from '../../../domain/entities/TourDuMonde'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

type SummaryPlayer = {
  readonly playerId: PlayerId
  /** `null` si le profil local a été supprimé depuis. L'UI décide du libellé. */
  readonly name: string | null
}

export type X01SummaryPlayer = SummaryPlayer & {
  readonly remaining: number
  readonly legsWonInSet: number
  readonly setsWon: number
}

export type TourDuMondeSummaryPlayer = SummaryPlayer & {
  /** Cibles validées, sur `targetsTotal`. */
  readonly targetIndex: number
  readonly finishedInDarts: number | null
}

type BaseSummary = {
  readonly id: MatchId
  readonly createdAt: number
  readonly updatedAt: number
  readonly finished: boolean
  /** `null` sur une partie en cours — et sur un match nul au Tour du monde. */
  readonly winnerId: PlayerId | null
  readonly totalVisits: number
}

export type X01Summary = BaseSummary & {
  readonly mode: 'X01'
  readonly config: X01Config
  readonly players: readonly X01SummaryPlayer[]
}

export type TourDuMondeSummary = BaseSummary & {
  readonly mode: 'TOUR_DU_MONDE'
  readonly config: TourDuMondeConfig
  readonly targetsTotal: number
  readonly players: readonly TourDuMondeSummaryPlayer[]
}

/**
 * Vue condensée d'un match, pour l'accueil (« reprendre la partie ») et
 * l'historique. Entièrement dérivée du journal : rien de tout ceci n'est stocké.
 *
 * ⚠️ Union discriminée par `mode` : un Tour du monde n'a pas de score restant,
 * un X01 n'a pas de cible courante. Plutôt qu'un type mou dont la moitié des
 * champs seraient vides selon le mode, chacun porte exactement ce qu'il a — et
 * TypeScript force l'UI à traiter les deux cas.
 */
export type MatchSummary = X01Summary | TourDuMondeSummary
