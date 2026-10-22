import { GameModes } from '../../domain/games'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { GetOngoingMatch } from '../ports/driving/GetOngoingMatch'
import type { MatchSummary } from '../ports/driving/MatchSummary'
import { nameIndex, summarize } from './summarize'

const PROFONDEUR = 20

export class GetOngoingMatchUseCase implements GetOngoingMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(): Promise<MatchSummary | null> {
    const records = await this.matches.listRecent(PROFONDEUR)
    // ⚠️ Via la couture `GameModes`, jamais `X01Rules` : un autre mode n'est pas projetable en X01.
    const encours = records.find(
      (record) => !GameModes.isFinished(GameModes.project(record.events)),
    )
    if (!encours) return null

    return summarize(encours, await nameIndex(this.players))
  }
}
