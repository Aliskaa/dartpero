import type { CricketConfig } from '../../../domain/games/cricket/config'
import type {
  CricketMilestone,
  CricketState,
  CricketVisit,
} from '../../../domain/games/cricket/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartCricketCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: CricketConfig
  /** Qui commence. Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
}

export type CricketVisitResult = {
  readonly state: CricketState
  readonly visit: CricketVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly CricketMilestone[]
}

/**
 * Tout ce qu'on fait d'une partie de Cricket.
 *
 * Port **regroupé** plutôt qu'éclaté en quatre, comme `PlayTourDuMonde` : les
 * quatre opérations partagent le même journal et la même mécanique de
 * persistance, les séparer n'apporterait que des fichiers.
 */
export interface PlayCricket {
  start(command: StartCricketCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<CricketState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CricketVisitResult>
  undoLastVisit(matchId: MatchId): Promise<CricketState>
}
