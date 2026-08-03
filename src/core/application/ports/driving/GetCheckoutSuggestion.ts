import type { SortieRules } from '../../../domain/services/checkout'
import type { Dart } from '../../../domain/value-objects/Dart'

export type CheckoutSuggestionQuery = {
  readonly remaining: number
  /** Fléchettes encore en main dans la volée en cours (1 à 3). */
  readonly dartsLeft: number
  /**
   * Volontairement plus étroit qu'un `X01Config` : sortir sur un double est la
   * seule règle qui change le calcul. L'entraînement au checkout peut donc
   * appeler ce port sans se fabriquer une fausse configuration de X01.
   */
  readonly config: SortieRules
}

/**
 * Synchrone, et c'est voulu : le calcul est pur et doit répondre à chaque
 * fléchette saisie, sans aller-retour asynchrone. Ce port existe pour que l'UI
 * n'importe jamais le domaine directement.
 */
export interface GetCheckoutSuggestion {
  execute(query: CheckoutSuggestionQuery): readonly Dart[] | null
}
