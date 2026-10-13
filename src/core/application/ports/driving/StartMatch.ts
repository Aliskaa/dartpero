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
  /**
   * Le nom **tapé**, brut : absent si rien n'a été tapé. Le use case le passe
   * par `MatchName.of` avant toute écriture ; le nom par défaut n'arrive
   * jamais ici.
   */
  readonly name?: string
}

export interface StartMatch {
  execute(command: StartMatchCommand): Promise<MatchId>
}
