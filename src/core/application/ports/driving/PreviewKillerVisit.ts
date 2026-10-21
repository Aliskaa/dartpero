import type { KillerState, KillerVisit } from '../../../domain/games/killer/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type KillerPreview = {
  /**
   * L'état **tel qu'il serait** si la volée en cours était enregistrée : vies,
   * statut killer et éliminations suivent chaque fléchette.
   *
   * ⚠️ Le tour de table y a déjà avancé : qui joue se lit sur l'état réel.
   */
  readonly state: KillerState
  /** La volée est close : trois fléchettes, partie gagnée, ou lanceur éliminé. */
  readonly complete: boolean
  /** La volée en cours et l'effet de chaque fléchette ; `null` sans fléchette. */
  readonly visit: KillerVisit | null
}

/**
 * Évalue une volée de Killer **sans rien écrire** — synchrone et pur. Il
 * appelle la même `KillerRules.applyVisit` que l'enregistrement : l'écran ne
 * peut pas montrer autre chose que ce que le journal rejouera.
 */
export interface PreviewKillerVisit {
  execute(input: { readonly state: KillerState; readonly darts: readonly Dart[] }): KillerPreview
}
