import type { X01State } from '../../../domain/games/x01/rules'
import type { MatchId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

/** Rouvre la dernière volée et en retire la dernière fléchette, même si elle concluait (voir `ReopenedVisit`). */
export interface UndoLastVisit {
  execute(matchId: MatchId): Promise<ReopenedVisit<X01State>>
}
