import { type CheckoutRange, checkoutRange, type SortieRules } from '../../domain/services/checkout'
import type { GetCheckoutRange } from '../ports/driving/GetCheckoutRange'

export class GetCheckoutRangeUseCase implements GetCheckoutRange {
  execute(config: SortieRules): CheckoutRange {
    return checkoutRange(config)
  }
}
