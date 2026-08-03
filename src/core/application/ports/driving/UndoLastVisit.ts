import type { X01State } from '../../../domain/games/x01/rules'
import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * Annule la dernière volée enregistrée, y compris si elle avait gagné un leg,
 * un set ou le match : le journal perd son dernier événement et l'état est
 * intégralement rejoué.
 */
export interface UndoLastVisit {
  execute(matchId: MatchId): Promise<X01State>
}
