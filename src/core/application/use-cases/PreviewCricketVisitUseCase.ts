import { CricketRules, type CricketState } from '../../domain/games/cricket/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import type { CricketPreview, PreviewCricketVisit } from '../ports/driving/PreviewCricketVisit'

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
    return { state: apres, complete: apres.finished || darts.length >= 3 }
  }
}
