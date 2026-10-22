import type { GameModeId } from '../../domain/games'
import { modeOf } from '../../domain/games'
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

  async execute(limit = 20, mode?: GameModeId): Promise<readonly MatchSummary[]> {
    // Avec un filtre il faut tout lire : le mode se lit sur le premier événement, aucun index ne l'a.
    const [records, names] = await Promise.all([
      mode ? this.matches.listAll() : this.matches.listRecent(limit),
      nameIndex(this.players),
    ])

    return records
      .filter((record) => mode === undefined || modeOf(record.events) === mode)
      .slice(0, limit)
      .map((record) => summarize(record, names))
  }
}
