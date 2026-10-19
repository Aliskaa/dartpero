import { DomainError } from '../../domain/DomainError'
import { type AnyMatchState, GameModes } from '../../domain/games'
import type { Dart } from '../../domain/value-objects/Dart'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { VisitDraft, VisitDraftRepository } from '../ports/driven/VisitDraftRepository'
import type {
  ManageVisitDraft,
  RestoreVisitDraftQuery,
  SaveVisitDraftCommand,
} from '../ports/driving/ManageVisitDraft'
import { versDart } from './backupSchema'

/** Une volée compte 1 à 3 fléchettes : au-delà, ce n'est pas une volée. */
const MAX_FLECHETTES = 3

export class ManageVisitDraftUseCase implements ManageVisitDraft {
  constructor(
    private readonly matches: MatchRepository,
    private readonly drafts: VisitDraftRepository,
  ) {}

  /**
   * ⚠️ Aucune lecture du journal, et aucun `await` avant l'appel au dépôt : le
   * brouillon est estampillé avec l'état **que l'écran affichait** quand la
   * fléchette a été posée (`base`), jamais relu à l'écriture. Une écriture
   * lancée avant l'enregistrement d'une volée, et terminée après, porte donc
   * l'ancien nombre de volées : périmée, elle ne sera jamais rendue au joueur
   * suivant. C'est toute la raison de la clé `visitCount`.
   */
  async save({ matchId, base, darts }: SaveVisitDraftCommand): Promise<void> {
    if (darts.length === 0) return this.drafts.delete(matchId)
    if (darts.length > MAX_FLECHETTES) {
      throw new DomainError(`a visit holds 1 to 3 darts, got ${darts.length}`)
    }
    return this.drafts.save({ matchId, visitCount: GameModes.visitCount(base), darts: [...darts] })
  }

  /**
   * Rendu seulement s'il est cohérent : 1 à 3 fléchettes valides (la validation
   * de l'import), une partie qui existe, se rejoue et n'est pas terminée, du
   * même mode que l'état chargé, et le même nombre de volées dans le brouillon,
   * le journal et l'état chargé. Sinon il est effacé — au mieux — et rien n'est
   * rendu. La légalité de chaque fléchette dans la volée se juge côté écran,
   * avec le port de prévisualisation du mode.
   */
  async restore({ matchId, base }: RestoreVisitDraftQuery): Promise<readonly Dart[]> {
    const draft = await this.drafts.findById(matchId)
    if (draft === null) return []

    const darts = await this.coherent(matchId, draft, base)
    if (darts !== null) return darts

    try {
      await this.drafts.delete(matchId)
    } catch {
      // Un brouillon qu'on n'arrive pas à effacer reste écarté : la prochaine
      // fléchette l'écrasera.
    }
    return []
  }

  private async coherent(
    matchId: MatchId,
    draft: VisitDraft,
    base: AnyMatchState,
  ): Promise<readonly Dart[] | null> {
    try {
      const brutes: unknown = draft.darts
      if (!Array.isArray(brutes) || brutes.length < 1 || brutes.length > MAX_FLECHETTES) {
        return null
      }
      const darts = brutes.map(versDart)

      const record = await this.matches.findById(matchId)
      if (record === null) return null
      const journal = GameModes.project(record.events)
      if (GameModes.isFinished(journal) || journal.mode !== base.mode) return null

      const volees = GameModes.visitCount(journal)
      if (draft.visitCount !== volees || volees !== GameModes.visitCount(base)) return null
      return darts
    } catch {
      // Journal illisible, fléchette inventée : incohérent, donc écarté.
      return null
    }
  }
}
