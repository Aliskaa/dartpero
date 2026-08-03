import type { X01Config } from '../../../domain/games/x01/config'
import type { Dart } from '../../../domain/value-objects/Dart'

export type BuildVisitFromScoreQuery = {
  readonly config: X01Config
  /** Le score annoncé pour la volée (0 à 180). */
  readonly total: number
  /** Combien de fléchettes ont réellement été lancées. */
  readonly dartsUsed: number
  /** Vrai si cette volée clôt le leg : la dernière fléchette doit être un double. */
  readonly finishOnDouble: boolean
}

/**
 * Mode de saisie rapide : convertit un score de volée en fléchettes
 * enregistrables. `null` si le total est impossible à faire.
 */
export interface BuildVisitFromScore {
  execute(query: BuildVisitFromScoreQuery): readonly Dart[] | null
}
