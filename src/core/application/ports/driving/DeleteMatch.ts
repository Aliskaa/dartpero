import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * Effacer une partie de l'historique. Sans corbeille : la sauvegarde JSON du
 * lot 4 est le filet de sécurité, pas une poubelle à moitié vidée.
 */
export interface DeleteMatch {
  execute(matchId: MatchId): Promise<void>
}
