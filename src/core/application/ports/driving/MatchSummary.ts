import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type { X01Config } from '../../../domain/games/x01/config'
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
 * Un exercice solo : pas d'adversaire, donc pas de vainqueur — `winnerId` y
 * vaut toujours `null`. Ce qui compte, c'est le taux de réussite.
 */
export type CheckoutPracticeSummary = BaseSummary & {
  readonly mode: 'CHECKOUT_PRACTICE'
  readonly config: CheckoutPracticeConfig
  readonly players: readonly SummaryPlayer[]
  readonly roundsWon: number
  readonly roundsPlayed: number
  readonly successPercent: number
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
export type MatchSummary = X01Summary | TourDuMondeSummary | CheckoutPracticeSummary
