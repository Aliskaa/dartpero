import type { CricketConfig } from '../../../domain/games/cricket/config'
import type {
  CricketMilestone,
  CricketState,
  CricketVisit,
} from '../../../domain/games/cricket/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartCricketCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: CricketConfig
  /** Qui commence. Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /**
   * Tirer l'ordre de passage au sort plutôt que de le choisir.
   *
   * ⚠️ Le tirage est fait **ici** et son résultat est écrit dans l'événement
   * d'ouverture : l'ordre est donc figé pour toujours. Mélanger côté UI aurait
   * demandé un `Math.random()` dans l'écran — donc un lancement intestable — et
   * mélanger à la projection redistribuerait les joueurs à chaque annulation.
   */
  readonly shuffle?: boolean
  /**
   * Le nom **tapé**, brut : absent si rien n'a été tapé. Le use case le passe
   * par `MatchName.of` avant toute écriture ; le nom par défaut n'arrive
   * jamais ici.
   */
  readonly name?: string
}

export type CricketVisitResult = {
  readonly state: CricketState
  readonly visit: CricketVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly CricketMilestone[]
}

/**
 * Tout ce qu'on fait d'une partie de Cricket.
 *
 * Port **regroupé** plutôt qu'éclaté en quatre, comme `PlayTourDuMonde` : les
 * quatre opérations partagent le même journal et la même mécanique de
 * persistance, les séparer n'apporterait que des fichiers.
 */
export interface PlayCricket {
  start(command: StartCricketCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<CricketState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CricketVisitResult>
  undoLastVisit(matchId: MatchId): Promise<CricketState>
}
