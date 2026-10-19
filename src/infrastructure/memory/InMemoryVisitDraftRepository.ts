import type {
  VisitDraft,
  VisitDraftRepository,
} from '@/core/application/ports/driven/VisitDraftRepository'
import type { MatchId } from '@/core/domain/value-objects/ids'

/** Adapter mémoire du brouillon de volée : une ligne par partie, comme la table Dexie. */
export class InMemoryVisitDraftRepository implements VisitDraftRepository {
  private readonly drafts = new Map<MatchId, VisitDraft>()

  async save(draft: VisitDraft): Promise<void> {
    this.drafts.set(draft.matchId, draft)
  }

  async findById(matchId: MatchId): Promise<VisitDraft | null> {
    return this.drafts.get(matchId) ?? null
  }

  async delete(matchId: MatchId): Promise<void> {
    this.drafts.delete(matchId)
  }
}
