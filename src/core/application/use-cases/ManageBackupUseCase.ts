import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { VisitDraftRepository } from '../ports/driven/VisitDraftRepository'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type Backup,
  type ImportReport,
  type ManageBackup,
} from '../ports/driving/ManageBackup'
import { ouvrirEnveloppe, versMatchRecord, versPlayer } from './backupSchema'

export class ManageBackupUseCase implements ManageBackup {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly drafts: VisitDraftRepository,
    private readonly clock: Clock,
  ) {}

  /** Le brouillon de volée n'est jamais exporté (lot `volee-partielle`) : seuls profils et journaux partent. */
  async exportAll(): Promise<Backup> {
    const [profils, records] = await Promise.all([this.players.listAll(), this.matches.listAll()])

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: this.clock.now(),
      players: profils.map((profil) => ({
        id: profil.id,
        name: profil.name,
        color: profil.color,
        createdAt: profil.createdAt,
      })),
      matches: records.map((record) => ({
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        events: record.events,
      })),
    }
  }

  /**
   * Fusion, jamais remplacement : un identifiant connu est écrasé, un inconnu
   * s'ajoute, et rien n'est effacé. Se tromper de fichier ne doit pas coûter
   * une soirée de parties.
   *
   * ⚠️ Seule exception (lot `volee-partielle`) : la volée en cours d'une partie
   * **que le fichier remplace** est effacée — elle prolongeait un journal qui
   * n'est plus là. Effacée après la validation de l'entrée, avant l'écriture de
   * son journal : une entrée illisible garde son brouillon, et une partie absente
   * du fichier garde le sien.
   *
   * Les entrées illisibles sont comptées puis ignorées — une partie corrompue
   * n'emporte pas les cinquante autres avec elle.
   */
  async importFrom(contenu: unknown): Promise<ImportReport> {
    const { players, matches } = ouvrirEnveloppe(contenu)

    let playersImported = 0
    let playersSkipped = 0
    for (const brut of players) {
      try {
        await this.players.save(versPlayer(brut))
        playersImported += 1
      } catch {
        playersSkipped += 1
      }
    }

    let matchesImported = 0
    let matchesSkipped = 0
    for (const brut of matches) {
      try {
        const record = versMatchRecord(brut)
        await this.drafts.delete(record.id)
        await this.matches.save(record)
        matchesImported += 1
      } catch {
        matchesSkipped += 1
      }
    }

    return { playersImported, matchesImported, playersSkipped, matchesSkipped }
  }
}
