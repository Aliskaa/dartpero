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

const MAX_FLECHETTES = 3

export class ManageVisitDraftUseCase implements ManageVisitDraft {
  constructor(
    private readonly matches: MatchRepository,
    private readonly drafts: VisitDraftRepository,
  ) {}

  // ⚠️ Ni lecture du journal ni `await` avant le dépôt : `visitCount` vient de `base`, l'état affiché,
  // pour qu'une écriture tardive reste périmée.
  async save({ matchId, base, darts }: SaveVisitDraftCommand): Promise<void> {
    if (darts.length === 0) return this.drafts.delete(matchId)
    if (darts.length > MAX_FLECHETTES) {
      throw new DomainError(`a visit holds 1 to 3 darts, got ${darts.length}`)
    }
    return this.drafts.save({ matchId, visitCount: GameModes.visitCount(base), darts: [...darts] })
  }

  // Rendu seulement s'il est cohérent avec le journal et l'état chargé ; sinon effacé (au mieux) et ignoré.
  async restore({ matchId, base }: RestoreVisitDraftQuery): Promise<readonly Dart[]> {
    const draft = await this.drafts.findById(matchId)
    if (draft === null) return []

    const darts = await this.coherent(matchId, draft, base)
    if (darts !== null) return darts

    try {
      await this.drafts.delete(matchId)
    } catch {
      // Écarté quand même : la prochaine fléchette l'écrasera.
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
