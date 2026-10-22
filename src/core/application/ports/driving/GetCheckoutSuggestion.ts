import type { SortieRules } from '../../../domain/services/checkout'
import type { Dart } from '../../../domain/value-objects/Dart'

export type CheckoutSuggestionQuery = {
  readonly remaining: number
  /** Fléchettes encore en main (1 à 3). */
  readonly dartsLeft: number
  /** Plus étroit qu'un `X01Config` pour servir aussi l'entraînement. */
  readonly config: SortieRules
}

/** Synchrone à dessein : calcul pur, appelé à chaque fléchette. */
export interface GetCheckoutSuggestion {
  execute(query: CheckoutSuggestionQuery): readonly Dart[] | null
}
