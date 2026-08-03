import { X01Rules } from '../../domain/games/x01/rules'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetOngoingMatch } from '../ports/driving/GetOngoingMatch'
import type { MatchSummary } from '../ports/driving/MatchSummary'
import { nameIndex, summarize } from './summarize'

/** Au-delà, un match non terminé est considéré comme abandonné. */
const PROFONDEUR = 20

export class GetOngoingMatchUseCase implements GetOngoingMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(): Promise<MatchSummary | null> {
    const records = await this.matches.listRecent(PROFONDEUR)
    const encours = records.find((record) => !X01Rules.isFinished(X01Rules.project(record.events)))
    if (!encours) return null

    return summarize(encours, await nameIndex(this.players))
  }
}
