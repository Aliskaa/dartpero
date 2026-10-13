import type { MatchId } from '../../../domain/value-objects/ids'
import type { MatchName } from '../../../domain/value-objects/MatchName'

/**
 * De quoi nommer une partie : le nom tapé s'il y en a un, et la date de
 * création qui sert à calculer le nom par défaut sinon.
 *
 * ⚠️ Le cœur rend des **faits**, pas un libellé : « Dimanche soir » est du
 * français, il se calcule dans l'UI (`nomDePartie`, `labels.ts`).
 */
export type MatchNaming = {
  /** `null` : aucun nom tapé à la création. */
  readonly name: MatchName | null
  readonly createdAt: number
}

/**
 * Le nom d'une partie, pour le bandeau des écrans de jeu et la tête des
 * résumés — qui ne lisent sinon que des projections d'état, sans nom ni date.
 * Une partie ne se renomme pas : la réponse peut se garder en cache.
 */
export interface GetMatchName {
  execute(matchId: MatchId): Promise<MatchNaming>
}
