import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CricketConfig } from '../../../domain/games/cricket/config'
import type { KillerConfig } from '../../../domain/games/killer/config'
import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type { X01Config } from '../../../domain/games/x01/config'
import type { PlayerId } from '../../../domain/value-objects/ids'

type Commun = {
  /** Mode + réglages + ensemble de joueurs : stable, sert de clé React. */
  readonly key: string
  /** Dans l'ordre de la partie la plus récente du groupe. */
  readonly playerIds: readonly PlayerId[]
  /** Toutes parties confondues (terminées, abandonnées, en cours). */
  readonly count: number
  readonly lastPlayedAt: number
}

export type ReplayableConfiguration = Commun &
  (
    | { readonly mode: 'X01'; readonly config: X01Config }
    | { readonly mode: 'CRICKET'; readonly config: CricketConfig }
    | { readonly mode: 'TOUR_DU_MONDE'; readonly config: TourDuMondeConfig }
    | { readonly mode: 'KILLER'; readonly config: KillerConfig }
    | { readonly mode: 'CHECKOUT_PRACTICE'; readonly config: CheckoutPracticeConfig }
  )

export interface GetReplayableConfigurations {
  /** La plus récente d'abord ; profil supprimé écarté, liste non coupée (l'UI filtre puis coupe). */
  execute(): Promise<readonly ReplayableConfiguration[]>
}
