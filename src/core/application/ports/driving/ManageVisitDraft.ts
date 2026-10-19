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

/**
 * La volée en cours, gardée hors du journal (lot `volee-partielle`) : écrite à
 * chaque fléchette, relue à l'ouverture de la partie.
 *
 * Rien n'est dit, vibré ni célébré ici : c'est un simple dépôt de fléchettes,
 * que l'écran rend telles quelles. Le journal, lui, ne bouge pas.
 */
export interface ManageVisitDraft {
  /**
   * Écrit (ou efface, sans fléchette) le brouillon de la partie. Peut rejeter :
   * l'appelant avale l'échec, la saisie ne s'arrête jamais pour un brouillon.
   */
  save(command: SaveVisitDraftCommand): Promise<void>
  /**
   * Les fléchettes à rendre à la saisie : `[]` si la partie n'a pas de
   * brouillon, ou s'il est périmé ou incohérent avec le journal — il est alors
   * effacé, jamais appliqué.
   */
  restore(query: RestoreVisitDraftQuery): Promise<readonly Dart[]>
}
