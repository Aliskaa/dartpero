import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CheckoutPracticeState } from '../../../domain/games/checkout-practice/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartCheckoutPracticeCommand = {
  readonly playerId: PlayerId
  readonly config: CheckoutPracticeConfig
  /** Le nom tapé, brut : absent si rien n'a été tapé (voir `StartMatchCommand.name`). */
  readonly name?: string
}

export type CheckoutPracticeResult = {
  readonly state: CheckoutPracticeState
  /** La manche qui vient d'être jouée : réussie, bustée, ou simplement ratée. */
  readonly outcome: 'CHECKOUT' | 'BUSTED' | 'SCORED'
}

/**
 * L'entraînement au checkout : un reste tiré au sort, trois fléchettes pour le
 * sortir, et on recommence.
 *
 * Port regroupé, comme `PlayTourDuMonde` : les opérations partagent le même
 * journal et la même mécanique de persistance.
 */
export interface PlayCheckoutPractice {
  start(command: StartCheckoutPracticeCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<CheckoutPracticeState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CheckoutPracticeResult>
  undoLastVisit(matchId: MatchId): Promise<CheckoutPracticeState>
}
