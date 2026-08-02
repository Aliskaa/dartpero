import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetMatchHistory } from '../ports/driving/GetMatchHistory'
import type { MatchSummary } from '../ports/driving/MatchSummary'
import { nameIndex, summarize } from './summarize'

export class GetMatchHistoryUseCase implements GetMatchHistory {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(limit = 20): Promise<readonly MatchSummary[]> {
    const [records, names] = await Promise.all([
      this.matches.listRecent(limit),
      nameIndex(this.players),
    ])
    return records.map((record) => summarize(record, names))
  }
}
