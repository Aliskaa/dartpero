import type { CricketConfig } from '../../../domain/games/cricket/config'
import type {
  CricketMilestone,
  CricketState,
  CricketVisit,
} from '../../../domain/games/cricket/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

export type StartCricketCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: CricketConfig
  /** Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /** ⚠️ Le tirage se fait dans le use case et s'écrit dans l'ouverture : l'ordre est figé. */
  readonly shuffle?: boolean
  /** Le nom tapé, brut ; le use case le passe par `MatchName.of`. */
  readonly name?: string
}

export type CricketVisitResult = {
  readonly state: CricketState
  readonly visit: CricketVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly CricketMilestone[]
}

export interface PlayCricket {
  start(command: StartCricketCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<CricketState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CricketVisitResult>
  /** Retire la dernière fléchette jouée (voir `ReopenedVisit`). */
  undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<CricketState>>
}
