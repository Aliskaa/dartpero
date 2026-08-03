import type { TourDuMondeConfig } from '../../../domain/games/tour-du-monde/config'
import type {
  TourDuMondeMilestone,
  TourDuMondeState,
  TourDuMondeVisit,
} from '../../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartTourDuMondeCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: TourDuMondeConfig
  /** Qui commence. Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
}

export type TourDuMondeVisitResult = {
  readonly state: TourDuMondeState
  readonly visit: TourDuMondeVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly TourDuMondeMilestone[]
}

/**
 * Tout ce qu'on fait d'une partie de Tour du monde.
 *
 * Port **regroupé** plutôt qu'éclaté en quatre : les quatre opérations
 * partagent le même journal et la même mécanique de persistance, les séparer
 * n'apporterait que des fichiers. Même choix que pour `ManagePlayers`.
 */
export interface PlayTourDuMonde {
  start(command: StartTourDuMondeCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<TourDuMondeState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<TourDuMondeVisitResult>
  undoLastVisit(matchId: MatchId): Promise<TourDuMondeState>
}
