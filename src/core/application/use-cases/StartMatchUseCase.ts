import { DomainError } from '../../domain/DomainError'
import type { X01Started } from '../../domain/events/MatchEvent'
import { X01Rules } from '../../domain/games/x01/rules'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { StartMatch, StartMatchCommand } from '../ports/driving/StartMatch'

export class StartMatchUseCase implements StartMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(command: StartMatchCommand): Promise<MatchId> {
    const { playerIds, config, startingPlayerIndex = 0 } = command

    const profils = await Promise.all(playerIds.map((id) => this.players.findById(id)))
    const inconnus = playerIds.filter((_, index) => !profils[index])
    if (inconnus.length > 0) {
      throw new DomainError(`Unknown player(s): ${inconnus.join(', ')}`)
    }

    const started: X01Started = {
      type: 'MatchStarted',
      config,
      playerIds,
      startingPlayerIndex,
    }
    // Valide la composition du match AVANT de persister quoi que ce soit.
    X01Rules.start(started)

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events: [started] })

    return id
  }
}
