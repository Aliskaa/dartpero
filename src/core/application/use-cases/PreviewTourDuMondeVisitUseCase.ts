import { TourDuMondeRules, type TourDuMondeState } from '../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import type {
  PreviewTourDuMondeVisit,
  TourDuMondePreview,
} from '../ports/driving/PreviewTourDuMondeVisit'

/** Aucune dépendance : la projection est pure, elle ne lit ni n'écrit rien. */
export class PreviewTourDuMondeVisitUseCase implements PreviewTourDuMondeVisit {
  execute({
    state,
    darts,
  }: {
    readonly state: TourDuMondeState
    readonly darts: readonly Dart[]
  }): TourDuMondePreview {
    // `applyVisit` refuse une volée vide : rien à prévoir tant qu'aucune
    // fléchette n'est plantée.
    if (darts.length === 0) return { state, complete: false, completesTour: false }

    const apres = TourDuMondeRules.applyVisit(state, darts)
    const volee = apres.history.at(-1)
    const boucle = volee !== undefined && volee.targetIndexAfter >= state.config.targets.length

    // ⚠️ Contrairement au Cricket, `apres.finished` n'entre PAS dans la formule :
    // au Tour du monde on finit le tour de table, donc la partie continue après
    // un bouclage. Ce qui clôt la volée, c'est que **ce joueur** n'ait plus de
    // cible, pas que la partie s'arrête.
    return { state: apres, complete: boucle || darts.length >= 3, completesTour: boucle }
  }
}
