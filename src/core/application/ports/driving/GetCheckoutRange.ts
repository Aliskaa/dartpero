import type { CheckoutRange, SortieRules } from '../../../domain/services/checkout'

/** Borne de checkout (170 sur un double, 180 libre) et restes sans finish ; synchrone. */
export interface GetCheckoutRange {
  execute(config: SortieRules): CheckoutRange
}
