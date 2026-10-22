import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { DeviceContents, GetDeviceContents } from '../ports/driving/GetDeviceContents'

export class GetDeviceContentsUseCase implements GetDeviceContents {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(): Promise<DeviceContents> {
    const [matches, players] = await Promise.all([this.matches.listAll(), this.players.listAll()])
    return { matches: matches.length, players: players.length }
  }
}
