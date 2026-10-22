import type { X01Config } from '../../../domain/games/x01/config'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartMatchCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: X01Config
  /** Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
  /** ⚠️ Le tirage se fait dans le use case et s'écrit dans l'ouverture : l'ordre est figé. */
  readonly shuffle?: boolean
  /** Le nom tapé, brut ; le use case le passe par `MatchName.of`. */
  readonly name?: string
}

export interface StartMatch {
  execute(command: StartMatchCommand): Promise<MatchId>
}
