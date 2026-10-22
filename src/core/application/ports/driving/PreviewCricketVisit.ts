import type { CricketState } from '../../../domain/games/cricket/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type CricketPreview = {
  /** ⚠️ État si la volée était enregistrée : pas pour savoir qui joue (le tour a déjà avancé). */
  readonly state: CricketState
  readonly complete: boolean
}

/** Évalue une volée sans rien écrire, synchrone et pur. */
export interface PreviewCricketVisit {
  execute(input: { readonly state: CricketState; readonly darts: readonly Dart[] }): CricketPreview
}
