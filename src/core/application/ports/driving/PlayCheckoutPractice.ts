import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CheckoutPracticeState } from '../../../domain/games/checkout-practice/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

export type StartCheckoutPracticeCommand = {
  readonly playerId: PlayerId
  readonly config: CheckoutPracticeConfig
  /** Le nom tapé, brut (voir `StartMatchCommand.name`). */
  readonly name?: string
}

export type CheckoutPracticeResult = {
  readonly state: CheckoutPracticeState
  /** La manche qui vient d'être jouée. */
  readonly outcome: 'CHECKOUT' | 'BUSTED' | 'SCORED'
}

export interface PlayCheckoutPractice {
  start(command: StartCheckoutPracticeCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<CheckoutPracticeState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CheckoutPracticeResult>
  /** Retire la dernière fléchette jouée (voir `ReopenedVisit`). */
  undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<CheckoutPracticeState>>
}
