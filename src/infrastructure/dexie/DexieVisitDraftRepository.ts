import type {
  VisitDraft,
  VisitDraftRepository,
} from '@/core/application/ports/driven/VisitDraftRepository'
import { MatchId } from '@/core/domain/value-objects/ids'
import type { DartperoDatabase, StoredVisitDraft } from './database'

// ⚠️ Pas de revalidation ici : c'est `ManageVisitDraftUseCase.restore`.
const versDraft = (stored: StoredVisitDraft): VisitDraft => ({
  matchId: MatchId.of(stored.matchId),
  visitCount: stored.visitCount,
  darts: stored.darts,
})

export class DexieVisitDraftRepository implements VisitDraftRepository {
  constructor(private readonly db: DartperoDatabase) {}

  async save(draft: VisitDraft): Promise<void> {
    // Champ par champ : aucune clé `undefined` ni propriété étrangère sur le disque.
    await this.db.visitDrafts.put({
      matchId: draft.matchId,
      visitCount: draft.visitCount,
      darts: draft.darts.map(({ segment, multiplier }) => ({ segment, multiplier })),
    })
  }

  async findById(matchId: MatchId): Promise<VisitDraft | null> {
    const stored = await this.db.visitDrafts.get(matchId)
    return stored ? versDraft(stored) : null
  }

  async delete(matchId: MatchId): Promise<void> {
    await this.db.visitDrafts.delete(matchId)
  }
}
