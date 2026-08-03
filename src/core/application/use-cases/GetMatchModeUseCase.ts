import { type GameModeId, modeOf } from '../../domain/services/gameModes'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { GetMatchMode } from '../ports/driving/GetMatchMode'
import { loadMatch } from './loadMatch'

export class GetMatchModeUseCase implements GetMatchMode {
  constructor(private readonly matches: MatchRepository) {}

  async execute(matchId: MatchId): Promise<GameModeId> {
    return modeOf((await loadMatch(this.matches, matchId)).events)
  }
}
