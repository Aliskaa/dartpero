import type { PlayerId } from '../../../domain/value-objects/ids'

// ⚠️ Vrai hasard : le résultat peut être l'ordre reçu, aucune relance.
export interface ShuffleOrder {
  execute(playerIds: readonly PlayerId[]): readonly PlayerId[]
}
