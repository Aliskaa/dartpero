import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * Le brouillon de volée (lot `volee-partielle`) : les 1 à 3 fléchettes déjà
 * posées dans la volée en cours, **hors du journal**. Une ligne par partie.
 *
 * - `visitCount` : le nombre de volées enregistrées dans l'état **affiché** au
 *   moment de l'écriture (`GameModes.visitCount`). C'est la clé de cohérence :
 *   dès que le journal avance (volée enregistrée, annulée), le brouillon devient
 *   périmé et n'est plus jamais rendu.
 * - Aucun horodatage, aucun nom : rien de plus que ce qu'il faut pour rendre la
 *   volée telle quelle.
 *
 * ⚠️ Jamais exporté : `backupSchema` et `BACKUP_VERSION` ne le connaissent pas.
 */
export type VisitDraft = {
  readonly matchId: MatchId
  readonly visitCount: number
  readonly darts: readonly Dart[]
}

export interface VisitDraftRepository {
  /** Écrase le brouillon de la partie, s'il y en avait un. */
  save(draft: VisitDraft): Promise<void>
  /**
   * `null` si la partie n'a pas de brouillon. ⚠️ Ce qui revient du disque n'est
   * pas revalidé ici : `ManageVisitDraftUseCase.restore` s'en charge.
   */
  findById(matchId: MatchId): Promise<VisitDraft | null>
  /** Sans effet si la partie n'a pas de brouillon. */
  delete(matchId: MatchId): Promise<void>
}
