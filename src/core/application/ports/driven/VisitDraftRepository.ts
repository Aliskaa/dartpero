import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId } from '../../../domain/value-objects/ids'

/** ⚠️ Hors journal, jamais exporté ; `visitCount` (état affiché) est la clé de cohérence : périmé dès que le journal avance. */
export type VisitDraft = {
  readonly matchId: MatchId
  readonly visitCount: number
  readonly darts: readonly Dart[]
}

export interface VisitDraftRepository {
  save(draft: VisitDraft): Promise<void>
  /** ⚠️ Non revalidé ici : `ManageVisitDraftUseCase.restore` s'en charge. */
  findById(matchId: MatchId): Promise<VisitDraft | null>
  delete(matchId: MatchId): Promise<void>
}
