import { suggestCheckout } from '../../domain/games/x01/checkout'
import type { Dart } from '../../domain/value-objects/Dart'
import type {
  CheckoutSuggestionQuery,
  GetCheckoutSuggestion,
} from '../ports/driving/GetCheckoutSuggestion'

export class GetCheckoutSuggestionUseCase implements GetCheckoutSuggestion {
  execute({ remaining, dartsLeft, config }: CheckoutSuggestionQuery): readonly Dart[] | null {
    return suggestCheckout(remaining, dartsLeft, config)
  }
}
