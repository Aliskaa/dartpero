import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { DeviceContents, GetDeviceContents } from '../ports/driving/GetDeviceContents'

/**
 * Compte la base entière. Aucun journal n'est rejoué : une partie compte
 * quel que soit son mode ou son état, et un profil supprimé ne retire pas
 * ses parties (elles restent sous « Joueur supprimé »).
 */
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
