import type { Visit } from '../../../domain/entities/Visit'
import type { X01Milestone } from '../../../domain/events/MatchEvent'
import type { X01State } from '../../../domain/games/x01/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId } from '../../../domain/value-objects/ids'

export type RecordVisitCommand = {
  readonly matchId: MatchId
  readonly darts: readonly Dart[]
}

export type RecordVisitResult = {
  readonly state: X01State
  readonly visit: Visit
  /** Uniquement les jalons déclenchés par cette volée. */
  readonly milestones: readonly X01Milestone[]
}

export interface RecordVisit {
  execute(command: RecordVisitCommand): Promise<RecordVisitResult>
}
