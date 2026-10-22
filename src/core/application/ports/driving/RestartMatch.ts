import type { MatchId } from '../../../domain/value-objects/ids'

/** « On remet ça » : relance à l'identique (joueurs, ordre, règles) dans un journal neuf. */
export interface RestartMatch {
  execute(matchId: MatchId): Promise<MatchId>
}
