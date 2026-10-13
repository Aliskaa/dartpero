import { nameOf } from '../../domain/events/MatchEvent'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchName, MatchNaming } from '../ports/driving/GetMatchName'
import { loadMatch } from './loadMatch'

export class GetMatchNameUseCase implements GetMatchName {
  constructor(private readonly matches: MatchRepository) {}

  async execute(matchId: MatchId): Promise<MatchNaming> {
    const record = await loadMatch(this.matches, matchId)
    return { name: nameOf(record.events), createdAt: record.createdAt }
  }
}
