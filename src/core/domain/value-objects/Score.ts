import { DomainError } from '../DomainError'
import type { Branded } from './ids'

/** Un score restant, ou un nombre de points marqués. Toujours un entier >= 0. */
export type Score = Branded<number, 'Score'>

export const Score = {
  of(value: number): Score {
    if (!Number.isInteger(value)) throw new DomainError(`Score must be an integer, got ${value}`)
    if (value < 0) throw new DomainError(`Score cannot be negative, got ${value}`)
    return value as Score
  },

  get zero(): Score {
    return 0 as Score
  },
}
