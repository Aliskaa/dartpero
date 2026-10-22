import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CricketConfig } from '../../../domain/games/cricket/config'
import type { KillerConfig } from '../../../domain/games/killer/config'
import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type { X01Config } from '../../../domain/games/x01/config'
import type { SegmentNumber } from '../../../domain/value-objects/Dart'
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
  /** Cibles fermées, sur `targetsTotal`. */
  readonly closedTargets: number
  readonly score: number
}

export type KillerSummaryPlayer = SummaryPlayer & {
  readonly number: SegmentNumber
  readonly lives: number
  readonly killer: boolean
  readonly eliminated: boolean
  /** Rang de `KillerRules.ranking` : partagé entre vivants à vies égales en cours de partie. */
  readonly rank: number
}

type BaseSummary = {
  readonly id: MatchId
  /** Le nom tapé à la création ; `null` : l'UI affiche le nom par défaut. */
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
  /** Manches jouées, tous sets confondus (nombre de `LegWon`). */
  readonly legsPlayed: number
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

export type KillerSummary = BaseSummary & {
  readonly mode: 'KILLER'
  readonly config: KillerConfig
  readonly players: readonly KillerSummaryPlayer[]
}

/** Exercice solo : `winnerId` y vaut toujours `null`. */
export type CheckoutPracticeSummary = BaseSummary & {
  readonly mode: 'CHECKOUT_PRACTICE'
  readonly config: CheckoutPracticeConfig
  readonly players: readonly SummaryPlayer[]
  readonly roundsWon: number
  readonly roundsPlayed: number
  readonly successPercent: number
}

/** Vue condensée d'un match, dérivée du journal (rien n'est stocké), discriminée par `mode`. */
export type MatchSummary =
  | X01Summary
  | TourDuMondeSummary
  | CricketSummary
  | KillerSummary
  | CheckoutPracticeSummary
