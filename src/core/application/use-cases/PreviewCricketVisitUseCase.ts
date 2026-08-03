import { CricketRules, type CricketState } from '../../domain/games/cricket/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import type { CricketPreview, PreviewCricketVisit } from '../ports/driving/PreviewCricketVisit'

/** Aucune dépendance : la projection est pure, elle ne lit ni n'écrit rien. */
export class PreviewCricketVisitUseCase implements PreviewCricketVisit {
  execute({
    state,
    darts,
  }: {
    readonly state: CricketState
    readonly darts: readonly Dart[]
  }): CricketPreview {
    if (darts.length === 0) return { state, complete: false }

    const apres = CricketRules.applyVisit(state, darts)
    // Une volée fait trois fléchettes — sauf celle qui gagne, que le domaine a
    // déjà tronquée.
    return { state: apres, complete: apres.finished || darts.length >= 3 }
  }
}
