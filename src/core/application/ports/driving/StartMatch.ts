import type { X01Config } from '../../../domain/games/x01/config'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartMatchCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: X01Config
  /** Qui commence le premier leg. Par défaut le premier de la liste. */
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
}

export interface StartMatch {
  execute(command: StartMatchCommand): Promise<MatchId>
}
