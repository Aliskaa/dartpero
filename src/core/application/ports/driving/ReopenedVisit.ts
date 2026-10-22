import type { Dart } from '../../../domain/value-objects/Dart'

// `state` : rejoué sans la volée rouverte ; `darts` : ses fléchettes restantes (la dernière en moins).
// ⚠️ Aucun événement nouveau : la volée rouverte vit hors journal (brouillon, `ManageVisitDraft`).
export type ReopenedVisit<S> = {
  readonly state: S
  readonly darts: readonly Dart[]
}
