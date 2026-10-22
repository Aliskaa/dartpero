import type { TourDuMondeState } from '../../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type TourDuMondePreview = {
  /** ⚠️ État si la volée était enregistrée : pas pour savoir qui joue (le tour a déjà avancé). */
  readonly state: TourDuMondeState
  readonly complete: boolean
  /** La dernière fléchette boucle le parcours du joueur (confirmée à l'écran) ; ni `complete` ni `state.finished` ne le disent. */
  readonly completesTour: boolean
}

/** Évalue une volée sans rien écrire, synchrone et pur. */
export interface PreviewTourDuMondeVisit {
  execute(input: {
    readonly state: TourDuMondeState
    readonly darts: readonly Dart[]
  }): TourDuMondePreview
}
