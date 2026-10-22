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
        ...(profil.gender !== undefined ? { gender: profil.gender } : {}),
      })),
      matches: records.map((record) => ({
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        events: record.events,
      })),
    }
  }

  // ⚠️ Fusion, jamais remplacement ; seul le brouillon d'une partie remplacée est effacé (après validation).
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
