import type { X01Config } from '../../../domain/entities/Match'
import type { MatchId, PlayerId } from '../../../domain/value-objects/ids'

export type StartMatchCommand = {
  readonly playerIds: readonly PlayerId[]
  readonly config: X01Config
  /** Qui commence le premier leg. Par défaut le premier de la liste. */
  readonly startingPlayerIndex?: number
}

export interface StartMatch {
  execute(command: StartMatchCommand): Promise<MatchId>
}
