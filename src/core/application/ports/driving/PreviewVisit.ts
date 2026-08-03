import type { VisitOutcome } from '../../../domain/entities/Visit'
import type { X01Config } from '../../../domain/games/x01/config'
import type { Dart } from '../../../domain/value-objects/Dart'

export type PreviewVisitQuery = {
  readonly config: X01Config
  readonly remaining: number
  readonly hasOpened: boolean
  /** Les fléchettes déjà saisies dans la volée en cours (0 à 3). */
  readonly darts: readonly Dart[]
}

export type VisitPreview = {
  readonly outcome: VisitOutcome
  readonly scored: number
  readonly remainingAfter: number
  readonly dartsUsed: number
  /** La volée est terminée : 3 fléchettes, un bust, ou une sortie. */
  readonly complete: boolean
}

/**
 * Évalue une volée **en cours de saisie**, sans rien enregistrer.
 *
 * Indispensable à l'écran de match : le score affiché doit suivre chaque
 * fléchette, et l'app doit savoir tout de suite qu'un bust ou une sortie
 * clôt la volée. Synchrone, parce que c'est un calcul pur qui répond à
 * chaque appui.
 */
export interface PreviewVisit {
  execute(query: PreviewVisitQuery): VisitPreview
}
