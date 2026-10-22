import type { AnyMatchState } from '../../../domain/games'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId } from '../../../domain/value-objects/ids'

export type SaveVisitDraftCommand = {
  readonly matchId: MatchId
  /** L'état **affiché** quand les fléchettes ont été posées : il estampille le brouillon. */
  readonly base: AnyMatchState
  /** 0 à 3 fléchettes ; aucune efface le brouillon. */
  readonly darts: readonly Dart[]
}

export type RestoreVisitDraftQuery = {
  readonly matchId: MatchId
  /** L'état que l'écran vient de charger : le brouillon doit lui correspondre. */
  readonly base: AnyMatchState
}

export interface ManageVisitDraft {
  /** Peut rejeter : l'appelant avale l'échec, la saisie ne s'arrête jamais pour un brouillon. */
  save(command: SaveVisitDraftCommand): Promise<void>
  /** `[]` si absent, périmé ou incohérent avec le journal (alors effacé). */
  restore(query: RestoreVisitDraftQuery): Promise<readonly Dart[]>
}
