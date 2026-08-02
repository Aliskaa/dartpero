import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
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
        await this.matches.save(versMatchRecord(brut))
        matchesImported += 1
      } catch {
        matchesSkipped += 1
      }
    }

    return { playersImported, matchesImported, playersSkipped, matchesSkipped }
  }
}
