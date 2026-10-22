import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type {
  TourDuMondeMilestone,
  TourDuMondeState,
  TourDuMondeVisit,
} from '../../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

export type StartTourDuMondeCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: TourDuMondeConfig
  /** Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /** ⚠️ Le tirage se fait dans le use case et s'écrit dans l'ouverture : l'ordre est figé. */
  readonly shuffle?: boolean
  /** Le nom tapé, brut ; le use case le passe par `MatchName.of`. */
  readonly name?: string
}

export type TourDuMondeVisitResult = {
  readonly state: TourDuMondeState
  readonly visit: TourDuMondeVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly TourDuMondeMilestone[]
}

export interface PlayTourDuMonde {
  start(command: StartTourDuMondeCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<TourDuMondeState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<TourDuMondeVisitResult>
  /** Retire la dernière fléchette jouée (voir `ReopenedVisit`). */
  undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<TourDuMondeState>>
}
