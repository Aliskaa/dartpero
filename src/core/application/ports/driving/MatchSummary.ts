import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CricketConfig } from '../../../domain/games/cricket/config'
import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type { X01Config } from '../../../domain/games/x01/config'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { MatchName } from '../../../domain/value-objects/MatchName'

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

export type CricketSummaryPlayer = SummaryPlayer & {
  /** Cibles fermées, sur `targetsTotal`. Le détail marque par marque n'a pas sa
   * place dans un aperçu : ce qu'on veut savoir, c'est qui est près de finir. */
  readonly closedTargets: number
  readonly score: number
}

type BaseSummary = {
  readonly id: MatchId
  /**
   * Le nom **tapé** à la création, `null` s'il n'y en a pas — l'UI affiche
   * alors le nom par défaut, calculé depuis `createdAt`.
   */
  readonly name: MatchName | null
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

export type CricketSummary = BaseSummary & {
  readonly mode: 'CRICKET'
  readonly config: CricketConfig
  readonly targetsTotal: number
  readonly players: readonly CricketSummaryPlayer[]
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
export type MatchSummary =
  | X01Summary
  | TourDuMondeSummary
  | CricketSummary
  | CheckoutPracticeSummary
