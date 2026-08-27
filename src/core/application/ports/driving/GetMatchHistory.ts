import type { GameModeId } from '../../../domain/games'
import type { MatchSummary } from './MatchSummary'

export interface GetMatchHistory {
  /**
   * Les parties les plus récentes d'abord.
   *
   * ⚠️ `mode` filtre **avant** de couper à `limit`, jamais après : chercher
   * « les Cricket » dans les vingt dernières parties n'en rendrait aucune le
   * soir où l'on n'a joué que du X01. C'est la différence entre un filtre et
   * une coïncidence.
   */
  execute(limit?: number, mode?: GameModeId): Promise<readonly MatchSummary[]>
}
