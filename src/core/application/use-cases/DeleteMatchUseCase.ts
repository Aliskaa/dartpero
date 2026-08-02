import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { DeleteMatch } from '../ports/driving/DeleteMatch'

export class DeleteMatchUseCase implements DeleteMatch {
  constructor(private readonly matches: MatchRepository) {}

  async execute(matchId: MatchId): Promise<void> {
    await this.matches.delete(matchId)
  }
}
