import { DomainError } from '../../domain/DomainError'
import type { X01Started } from '../../domain/events/MatchEvent'
import { X01Rules } from '../../domain/games/x01/rules'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { RandomSource } from '../ports/driven/RandomSource'
import type { StartMatch, StartMatchCommand } from '../ports/driving/StartMatch'
import { nameField } from './nameField'
import { shufflePlayers } from './shufflePlayers'

export class StartMatchUseCase implements StartMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource,
  ) {}

  async execute(command: StartMatchCommand): Promise<MatchId> {
    const { config, startingPlayerIndex = 0, shuffle = false } = command
    const name = nameField(command.name)
    const playerIds = shuffle ? shufflePlayers(command.playerIds, this.random) : command.playerIds

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
      ...name,
    }
    X01Rules.start(started)

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events: [started] })

    return id
  }
}
