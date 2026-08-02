import type { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import type { Score } from '../value-objects/Score'

/**
 * - `SCORED`   : la volée a décompté normalement.
 * - `BUSTED`   : volée annulée, le score revient à `remainingBefore`.
 * - `CHECKOUT` : le joueur est tombé à 0 et gagne le leg.
 */
export type VisitOutcome = 'SCORED' | 'BUSTED' | 'CHECKOUT'

/**
 * Une volée telle qu'elle apparaît dans l'historique **projeté**.
 *
 * Ce n'est pas ce qui est stocké : le journal d'événements ne garde que les
 * fléchettes lancées (voir `MatchEvent`). Tout le reste — issue, points
 * marqués, restes — est recalculé par les règles, ce qui rend impossible un
 * désaccord entre le journal et le score affiché.
 */
export type Visit = {
  readonly playerId: PlayerId
  /** Tronqué aux fléchettes réellement décomptées (une volée s'arrête au bust). */
  readonly darts: readonly Dart[]
  readonly outcome: VisitOutcome
  /** 0 sur un bust : la volée entière est annulée. */
  readonly scored: number
  readonly remainingBefore: Score
  readonly remainingAfter: Score
  /** Numéro de leg global (0-based), tous sets confondus. */
  readonly legNumber: number
}
