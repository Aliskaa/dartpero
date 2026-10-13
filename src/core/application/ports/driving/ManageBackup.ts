import type { MatchEvent } from '../../../domain/events/MatchEvent'

/**
 * La version du format de fichier. À incrémenter si sa forme change de façon
 * **incompatible**.
 *
 * Un ajout facultatif ne l'incrémente pas : le `name` des ouvertures (lot
 * `nom-de-partie`) est resté en version 1, comme les trois modes ajoutés avant
 * lui. Une version plus ancienne de l'app perd le nom (cosmétique) au lieu de
 * refuser tout le fichier.
 */
export const BACKUP_VERSION = 1

/** Signature du fichier : évite d'importer par erreur un JSON qui n'a rien à voir. */
export const BACKUP_FORMAT = 'dartpero-backup'

export type BackupPlayer = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly createdAt: number
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

/**
 * Ce qui est réellement entré, et ce qui a été laissé de côté.
 *
 * Un fichier à moitié abîmé restaure quand même ce qui est lisible : tout
 * rejeter pour une partie corrompue ferait perdre les cinquante autres. Les
 * compteurs remontent à l'UI pour qu'elle puisse le dire franchement.
 */
export type ImportReport = {
  readonly playersImported: number
  readonly matchesImported: number
  readonly playersSkipped: number
  readonly matchesSkipped: number
}

/**
 * Export / import JSON de toute la base — le filet de sécurité obligatoire des
 * profils locaux : sans compte ni serveur, c'est la seule façon de changer de
 * téléphone sans repartir de zéro.
 */
export interface ManageBackup {
  exportAll(): Promise<Backup>
  /**
   * Fusionne dans la base existante : un identifiant déjà connu est écrasé, un
   * inconnu s'ajoute. Jamais d'effacement — on ne perd pas des parties parce
   * qu'on s'est trompé de fichier.
   */
  importFrom(contenu: unknown): Promise<ImportReport>
}
