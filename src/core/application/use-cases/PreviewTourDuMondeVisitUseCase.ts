import { TourDuMondeRules, type TourDuMondeState } from '../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import type {
  PreviewTourDuMondeVisit,
  TourDuMondePreview,
} from '../ports/driving/PreviewTourDuMondeVisit'

export class PreviewTourDuMondeVisitUseCase implements PreviewTourDuMondeVisit {
  execute({
    state,
    darts,
  }: {
    readonly state: TourDuMondeState
    readonly darts: readonly Dart[]
  }): TourDuMondePreview {
    // `applyVisit` refuse une volée vide.
    if (darts.length === 0) return { state, complete: false, completesTour: false }

    const apres = TourDuMondeRules.applyVisit(state, darts)
    const volee = apres.history.at(-1)
    const boucle = volee !== undefined && volee.targetIndexAfter >= state.config.targets.length

    // ⚠️ `apres.finished` n'entre pas ici (on finit le tour de table) : la volée se clôt quand ce joueur n'a plus de cible.
    return { state: apres, complete: boucle || darts.length >= 3, completesTour: boucle }
  }
}
