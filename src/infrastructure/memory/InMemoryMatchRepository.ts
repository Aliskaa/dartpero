import type { MatchRecord, MatchRepository } from '@/core/application/ports/driven/MatchRepository'
import type { MatchId } from '@/core/domain/value-objects/ids'

/**
 * Adapter mémoire : utilisé par les tests, et comme repli si IndexedDB est
 * indisponible (navigation privée sur certains navigateurs).
 */
export class InMemoryMatchRepository implements MatchRepository {
  private readonly records = new Map<MatchId, MatchRecord>()
  /** Ordre d'insertion, pour départager deux matchs de même `updatedAt`. */
  private readonly sequence = new Map<MatchId, number>()
  private compteur = 0

  async save(record: MatchRecord): Promise<void> {
    if (!this.sequence.has(record.id)) {
      this.compteur += 1
      this.sequence.set(record.id, this.compteur)
    }
    this.records.set(record.id, record)
  }

  async findById(id: MatchId): Promise<MatchRecord | null> {
    return this.records.get(id) ?? null
  }

  async listRecent(limit = 20): Promise<readonly MatchRecord[]> {
    return [...this.records.values()]
      .sort((a, b) => {
        const parDate = b.updatedAt - a.updatedAt
        if (parDate !== 0) return parDate
        return (this.sequence.get(b.id) ?? 0) - (this.sequence.get(a.id) ?? 0)
      })
      .slice(0, limit)
  }
}
