import type { KillerConfig } from '../../../domain/games/killer/config'
import type { KillerMilestone, KillerState, KillerVisit } from '../../../domain/games/killer/rules'
import type { Dart, SegmentNumber } from '../../../domain/value-objects/Dart'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'
import type { ReopenedVisit } from './ReopenedVisit'

export type StartKillerCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: KillerConfig
  /**
   * Les numéros choisis à l'étape 2, `numbers[i]` pour `playerIds[i]`.
   * ⚠️ Absents, ils sont **tirés ici** (`RandomSource`) puis écrits dans
   * l'ouverture : un tirage ne se rejoue jamais.
   */
  readonly numbers?: readonly SegmentNumber[]
  /** Qui commence. Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /** Le nom **tapé**, brut : absent si rien n'a été tapé (voir `nameField`). */
  readonly name?: string
}

export type KillerVisitResult = {
  readonly state: KillerState
  readonly visit: KillerVisit
  /** Uniquement les jalons déclenchés par CETTE volée. */
  readonly milestones: readonly KillerMilestone[]
}

/**
 * Tout ce qu'on fait d'une partie de Killer. Port **regroupé**, comme
 * `PlayCricket` : les quatre opérations partagent le même journal.
 */
export interface PlayKiller {
  start(command: StartKillerCommand): Promise<MatchId>
  getState(matchId: MatchId): Promise<KillerState>
  recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<KillerVisitResult>
  /**
   * Retire la dernière fléchette jouée : la dernière volée quitte le journal et
   * ses fléchettes restantes reviennent à la saisie (voir `ReopenedVisit`).
   */
  undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<KillerState>>
}
