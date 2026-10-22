import type { KillerState, KillerVisit } from '../../../domain/games/killer/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type KillerPreview = {
  /** ⚠️ État si la volée était enregistrée : pas pour savoir qui joue (le tour a déjà avancé). */
  readonly state: KillerState
  readonly complete: boolean
  /** `null` sans fléchette. */
  readonly visit: KillerVisit | null
}

/** Évalue une volée sans rien écrire, avec la même `KillerRules.applyVisit` que l'enregistrement. */
export interface PreviewKillerVisit {
  execute(input: { readonly state: KillerState; readonly darts: readonly Dart[] }): KillerPreview
}
