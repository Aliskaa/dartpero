import { DomainError } from '../../domain/DomainError'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayCheckoutPractice } from '../ports/driving/PlayCheckoutPractice'
import type { PlayCricket } from '../ports/driving/PlayCricket'
import type { PlayTourDuMonde } from '../ports/driving/PlayTourDuMonde'
import type { RestartMatch } from '../ports/driving/RestartMatch'
import type { StartMatch } from '../ports/driving/StartMatch'
import { loadMatch } from './loadMatch'

/**
 * Relance une partie à l'identique.
 *
 * ⚠️ Ce use case **ne recopie pas** l'événement d'ouverture dans un nouveau
 * journal : il rappelle le lancement du mode concerné. C'est la seule façon de
 * garantir qu'une relance passe exactement par les mêmes contrôles qu'un
 * premier départ — profil supprimé entre-temps, validation des règles, et,
 * pour l'entraînement, le tirage d'une nouvelle cible. Recopier l'ouverture
 * aurait dupliqué ces trois décisions, donc créé trois occasions de diverger.
 *
 * Corollaire assumé : une session d'entraînement relancée tire de **nouvelles**
 * cibles. On refait le même exercice, pas la même série — refaire la série à
 * l'identique n'aurait aucun intérêt, on connaîtrait déjà les restes.
 *
 * L'aiguillage porte sur le type de l'événement d'ouverture, exactement comme
 * `modeOf` côté domaine : le mode se lit sur le premier événement du journal,
 * jamais sur un champ ajouté après coup.
 */
export class RestartMatchUseCase implements RestartMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly x01: StartMatch,
    private readonly tourDuMonde: PlayTourDuMonde,
    private readonly cricket: PlayCricket,
    private readonly practice: PlayCheckoutPractice,
  ) {}

  async execute(matchId: MatchId): Promise<MatchId> {
    const [ouverture] = (await loadMatch(this.matches, matchId)).events

    switch (ouverture?.type) {
      case 'MatchStarted':
        return this.x01.execute({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
        })

      case 'TourDuMondeStarted':
        return this.tourDuMonde.start({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
        })

      case 'CricketStarted':
        return this.cricket.start({
          playerIds: ouverture.playerIds,
          config: ouverture.config,
          startingPlayerIndex: ouverture.startingPlayerIndex,
        })

      case 'CheckoutPracticeStarted': {
        const [playerId] = ouverture.playerIds
        if (!playerId) throw new DomainError('A practice session needs its player')
        return this.practice.start({ playerId, config: ouverture.config })
      }

      default:
        throw new DomainError('A match log must start with an opening event')
    }
  }
}
