import type { Dependencies, Services } from '@/composition/container'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import type { GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'

/**
 * Lance une partie du mode demandé, avec ou sans nom tapé (la clé `name` n'est
 * posée que si fournie). Les modes viennent de la couture (`GameModeId`), pas
 * d'une liste recopiée : un cinquième mode fait échouer la compilation ici
 * (le `switch` n'a plus de retour pour lui) tant qu'il n'a pas son cas.
 */
export const lancer = (
  services: Services,
  mode: GameModeId,
  joueurs: readonly PlayerId[],
  nom?: string,
): Promise<MatchId> => {
  const name = nom === undefined ? {} : { name: nom }
  switch (mode) {
    case 'X01':
      return services.startMatch.execute({
        playerIds: joueurs,
        config: X01Config.create({}),
        ...name,
      })
    case 'TOUR_DU_MONDE':
      return services.playTourDuMonde.start({
        playerIds: joueurs,
        config: TourDuMondeConfig.create(),
        ...name,
      })
    case 'CRICKET':
      return services.playCricket.start({
        playerIds: joueurs,
        config: CricketConfig.create(),
        ...name,
      })
    case 'CHECKOUT_PRACTICE': {
      const [playerId] = joueurs
      if (!playerId) throw new Error('un joueur attendu')
      return services.playCheckoutPractice.start({
        playerId,
        config: CheckoutPracticeConfig.create({ rounds: 3 }),
        ...name,
      })
    }
  }
}

export const ouverture = async (dependencies: Dependencies, id: MatchId): Promise<MatchEvent> => {
  const record = await dependencies.matches.findById(id)
  const premier = record?.events[0]
  if (!premier) throw new Error('partie introuvable')
  return premier
}
