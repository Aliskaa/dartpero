import type { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import type { Score } from '../value-objects/Score'

export type VisitOutcome = 'SCORED' | 'BUSTED' | 'CHECKOUT'

/** Une volée de l'historique projeté, jamais stockée telle quelle (le journal ne garde que les fléchettes). */
export type Visit = {
  readonly playerId: PlayerId
  /** Tronqué aux fléchettes décomptées. */
  readonly darts: readonly Dart[]
  readonly outcome: VisitOutcome
  /** 0 sur un bust. */
  readonly scored: number
  readonly remainingBefore: Score
  readonly remainingAfter: Score
  /** Global (0-based), tous sets confondus. */
  readonly legNumber: number
}
