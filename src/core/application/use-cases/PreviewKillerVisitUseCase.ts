import { KillerRules, type KillerState } from '../../domain/games/killer/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import type { KillerPreview, PreviewKillerVisit } from '../ports/driving/PreviewKillerVisit'

/** Aucune dépendance : la projection est pure, elle ne lit ni n'écrit rien. */
export class PreviewKillerVisitUseCase implements PreviewKillerVisit {
  execute({
    state,
    darts,
  }: {
    readonly state: KillerState
    readonly darts: readonly Dart[]
  }): KillerPreview {
    if (darts.length === 0) return { state, complete: false, visit: null }

    const apres = KillerRules.applyVisit(state, darts)
    return {
      state: apres,
      // Seule source du « complet » : la règle du domaine.
      complete: KillerRules.visitIsOver(state, darts),
      visit: apres.history.at(-1) ?? null,
    }
  }
}
