import type { X01State } from '../../../domain/games/x01/rules'
import type { MatchId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

/**
 * Rouvre la dernière volée enregistrée pour en retirer **une fléchette**, la
 * dernière (lot `annulation-volee`), y compris si elle avait gagné une manche,
 * un set ou le match.
 *
 * Le journal perd son dernier `VisitRecorded`, l'état est intégralement rejoué
 * (manches, sets et fin de partie sont des jalons déduits, jamais écrits), et
 * les fléchettes restantes de la volée reviennent à la saisie locale. Le nom
 * reste `UndoLastVisit` : c'est toujours la dernière volée qu'on défait, puis
 * qu'on rouvre.
 */
export interface UndoLastVisit {
  execute(matchId: MatchId): Promise<ReopenedVisit<X01State>>
}
