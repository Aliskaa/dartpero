import type { CheckoutPracticeConfig } from '../../../domain/games/checkout-practice/config'
import type { CricketConfig } from '../../../domain/games/cricket/config'
import type { KillerConfig } from '../../../domain/games/killer/config'
import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type { X01Config } from '../../../domain/games/x01/config'
import type { PlayerId } from '../../../domain/value-objects/ids'

type Commun = {
  /** La clé du groupe (mode + réglages + ensemble de joueurs) : stable, une clé React. */
  readonly key: string
  /** Les joueurs **dans l'ordre de la partie la plus récente** du groupe. */
  readonly playerIds: readonly PlayerId[]
  /** Combien de parties du groupe, terminées, abandonnées ou en cours confondues. */
  readonly count: number
  /** `createdAt` de la partie la plus récente du groupe. */
  readonly lastPlayedAt: number
}

/** Une configuration jouée : le mode, ses réglages, l'ensemble de joueurs. Union discriminée par `mode`. */
export type ReplayableConfiguration = Commun &
  (
    | { readonly mode: 'X01'; readonly config: X01Config }
    | { readonly mode: 'CRICKET'; readonly config: CricketConfig }
    | { readonly mode: 'TOUR_DU_MONDE'; readonly config: TourDuMondeConfig }
    | { readonly mode: 'KILLER'; readonly config: KillerConfig }
    | { readonly mode: 'CHECKOUT_PRACTICE'; readonly config: CheckoutPracticeConfig }
  )

export interface GetReplayableConfigurations {
  /**
   * Les configurations distinctes des parties récentes, la plus récente d'abord.
   *
   * Rien n'est stocké : tout se lit sur l'historique. Les parties dont un profil
   * a été supprimé sont écartées **avant** la fusion. La liste n'est **pas**
   * coupée : l'UI filtre ce qu'elle sait rejouer, puis coupe.
   */
  execute(): Promise<readonly ReplayableConfiguration[]>
}
