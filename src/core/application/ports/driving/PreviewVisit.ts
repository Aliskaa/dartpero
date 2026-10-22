import type { VisitOutcome } from '../../../domain/entities/Visit'
import type { X01Config } from '../../../domain/games/x01/config'
import type { Dart } from '../../../domain/value-objects/Dart'

export type PreviewVisitQuery = {
  readonly config: X01Config
  readonly remaining: number
  readonly hasOpened: boolean
  readonly darts: readonly Dart[]
}

export type VisitPreview = {
  readonly outcome: VisitOutcome
  readonly scored: number
  readonly remainingAfter: number
  readonly dartsUsed: number
  readonly complete: boolean
}

/** Évalue une volée en cours sans rien enregistrer, synchrone et pur. */
export interface PreviewVisit {
  execute(query: PreviewVisitQuery): VisitPreview
}
