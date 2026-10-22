import type { KillerConfig } from '../../../domain/games/killer/config'
import type { KillerMilestone, KillerState, KillerVisit } from '../../../domain/games/killer/rules'
import type { Dart, SegmentNumber } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

export type StartKillerCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: KillerConfig
  /** `numbers[i]` pour `playerIds[i]` ; ⚠️ absents, tirés dans le use case puis écrits dans l'ouverture. */
  readonly numbers?: readonly SegmentNumber[]
  /** Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /** Le nom tapé, brut (voir `nameField`). */
  readonly name?: string
}

export type KillerVisitResult = {
  readonly state: KillerState
  readonly visit: KillerVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly KillerMilestone[]
}

export interface PlayKiller {
  start(command: StartKillerCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<KillerState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<KillerVisitResult>
  /** Retire la dernière fléchette jouée (voir `ReopenedVisit`). */
  undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<KillerState>>
}
