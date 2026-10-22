import type { MatchId } from '../../../domain/value-objects/ids'
import type { MatchName } from '../../../domain/value-objects/MatchName'

// ⚠️ Des faits, pas un libellé : le nom par défaut se calcule dans l'UI depuis `createdAt`.
export type MatchNaming = {
  /** `null` : aucun nom tapé à la création. */
  readonly name: MatchName | null
  readonly createdAt: number
}

/** Une partie ne se renomme pas : la réponse peut se garder en cache. */
export interface GetMatchName {
  execute(matchId: MatchId): Promise<MatchNaming>
}
