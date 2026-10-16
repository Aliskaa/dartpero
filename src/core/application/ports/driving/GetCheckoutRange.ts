import type { CheckoutRange, SortieRules } from '../../../domain/services/checkout'

/**
 * Jusqu'où l'app propose une sortie, et les restes sans finish en dessous :
 * 170 et les bogey numbers sur un double, 180 et sa liste en sortie libre.
 *
 * Synchrone, comme `GetCheckoutSuggestion` : le calcul est pur. Ce port existe
 * pour que l'UI (la borne de « Pas de finish », la feuille de règles) ne lise
 * jamais une constante du domaine directement.
 */
export interface GetCheckoutRange {
  execute(config: SortieRules): CheckoutRange
}
