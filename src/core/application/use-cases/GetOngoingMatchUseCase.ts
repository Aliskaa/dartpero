import { GameModes } from '../../domain/games'
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
    // ⚠️ Via la couture, jamais via `X01Rules` : une partie d'un autre mode
    // n'est pas projetable en X01, et l'accueil planterait à la reprise.
    const encours = records.find(
      (record) => !GameModes.isFinished(GameModes.project(record.events)),
    )
    if (!encours) return null

    return summarize(encours, await nameIndex(this.players))
  }
}
