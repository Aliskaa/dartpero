import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { VisitDraftRepository } from '../ports/driven/VisitDraftRepository'
import type { DeleteMatch } from '../ports/driving/DeleteMatch'

export class DeleteMatchUseCase implements DeleteMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly drafts: VisitDraftRepository,
  ) {}

  /** Le brouillon de volée part avec sa partie (lot `volee-partielle`) : jamais d'orphelin. */
  async execute(matchId: MatchId): Promise<void> {
    await this.drafts.delete(matchId)
    await this.matches.delete(matchId)
  }
}
