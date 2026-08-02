import type { MatchRecord, MatchRepository } from '@/core/application/ports/driven/MatchRepository'
import { MatchId } from '@/core/domain/value-objects/ids'
import type { DartperoDatabase, StoredMatch } from './database'

const versRecord = (stored: StoredMatch): MatchRecord => ({
  id: MatchId.of(stored.id),
  createdAt: stored.createdAt,
  updatedAt: stored.updatedAt,
  events: stored.events,
})

export class DexieMatchRepository implements MatchRepository {
  constructor(private readonly db: DartperoDatabase) {}

  async save(record: MatchRecord): Promise<void> {
    await this.db.matches.put({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      events: [...record.events],
    })
  }

  async findById(id: MatchId): Promise<MatchRecord | null> {
    const stored = await this.db.matches.get(id)
    return stored ? versRecord(stored) : null
  }

  async listRecent(limit = 20): Promise<readonly MatchRecord[]> {
    const stored = await this.db.matches.orderBy('updatedAt').reverse().limit(limit).toArray()
    return stored.map(versRecord)
  }
}
