import type { MatchEvent } from '../../../domain/events/MatchEvent'

/** À incrémenter seulement si le format change de façon incompatible (un ajout facultatif ne compte pas). */
export const BACKUP_VERSION = 1

export const BACKUP_FORMAT = 'dartpero-backup'

export type BackupPlayer = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly createdAt: number
  /** `MASCULINE` ou `FEMININE` ; clé absente = « non précisé ». */
  readonly gender?: string
}

export type BackupMatch = {
  readonly id: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly events: readonly MatchEvent[]
}

export type Backup = {
  readonly format: typeof BACKUP_FORMAT
  readonly version: number
  readonly exportedAt: number
  readonly players: readonly BackupPlayer[]
  readonly matches: readonly BackupMatch[]
}

/** Ce qui est entré et ce qui est écarté : un fichier abîmé restaure quand même le lisible. */
export type ImportReport = {
  readonly playersImported: number
  readonly matchesImported: number
  readonly playersSkipped: number
  readonly matchesSkipped: number
}

/** Export / import JSON des profils et des journaux ; le brouillon de volée n'y va jamais. */
export interface ManageBackup {
  exportAll(): Promise<Backup>
  /** Fusionne sans jamais effacer, sauf le brouillon d'une partie que le fichier remplace. */
  importFrom(contenu: unknown): Promise<ImportReport>
}
