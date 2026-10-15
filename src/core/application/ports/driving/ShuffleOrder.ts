import type { PlayerId } from '../../../domain/value-objects/ids'

/**
 * « Tirer au sort » à l'étape Ordre : rebat l'ordre de passage, tout de suite,
 * pour que l'écran le montre avant le lancement. Synchrone : un geste sans I/O.
 *
 * ⚠️ Vrai hasard : le résultat peut être l'ordre reçu, aucune relance.
 */
export interface ShuffleOrder {
  execute(playerIds: readonly PlayerId[]): readonly PlayerId[]
}
