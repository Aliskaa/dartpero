import type { X01Config } from '../../../domain/games/x01/config'
import type { Dart } from '../../../domain/value-objects/Dart'

export type CheckoutSuggestionQuery = {
  readonly remaining: number
  /** Fléchettes encore en main dans la volée en cours (1 à 3). */
  readonly dartsLeft: number
  readonly config: X01Config
}

/**
 * Synchrone, et c'est voulu : le calcul est pur et doit répondre à chaque
 * fléchette saisie, sans aller-retour asynchrone. Ce port existe pour que l'UI
 * n'importe jamais le domaine directement.
 */
export interface GetCheckoutSuggestion {
  execute(query: CheckoutSuggestionQuery): readonly Dart[] | null
}
