import { DomainError } from '../../domain/DomainError'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayCheckoutPractice } from '../ports/driving/PlayCheckoutPractice'
import type { PlayCricket } from '../ports/driving/PlayCricket'
import type { PlayKiller } from '../ports/driving/PlayKiller'
import type { PlayTourDuMonde } from '../ports/driving/PlayTourDuMonde'
import type { RestartMatch } from '../ports/driving/RestartMatch'
import type { StartMatch } from '../ports/driving/StartMatch'
import { loadMatch } from './loadMatch'

// ⚠️ Rappelle le lancement du mode (mêmes contrôles qu'un premier départ), ne recopie pas l'ouverture ;
// l'entraînement tire donc de nouvelles cibles.
export class RestartMatchUseCase implements RestartMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly x01: StartMatch,
    private readonly tourDuMonde: PlayTourDuMonde,
    private readonly cricket: PlayCricket,
    private readonly practice: PlayCheckoutPractice,
    private readonly killer: PlayKiller,
  ) {}

  async execute(matchId: MatchId): Promise<MatchId> {
    const [ouverture] = (await loadMatch(this.matches, matchId)).events

    switch (ouverture?.type) {
      case 'MatchStarted':
        return this.x01.execute({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
          name: ouverture.name,
        })

      case 'TourDuMondeStarted':
        return this.tourDuMonde.start({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
          name: ouverture.name,
        })

      case 'CricketStarted':
        return this.cricket.start({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
          name: ouverture.name,
        })

      case 'KillerStarted':
        // ⚠️ Sans `numbers` : « On remet ça » tire de nouveaux numéros.
        return this.killer.start({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
          name: ouverture.name,
        })

      case 'CheckoutPracticeStarted': {
        const [playerId] = ouverture.playerIds
        if (!playerId) throw new DomainError('A practice session needs its player')
        return this.practice.start({ playerId, config: ouverture.config, name: ouverture.name })
      }

      default:
        throw new DomainError('A match log must start with an opening event')
    }
  }
}
