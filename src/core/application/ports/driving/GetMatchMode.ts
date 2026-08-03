import type { GameModeId } from '../../../domain/games'
import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * Dans quel mode se joue une partie — la question que pose l'UI avant de
 * choisir quel écran afficher, sans avoir à charger l'état complet ni à
 * connaître les règles.
 */
export interface GetMatchMode {
  execute(matchId: MatchId): Promise<GameModeId>
}
