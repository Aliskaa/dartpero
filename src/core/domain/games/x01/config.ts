import { DomainError } from '../../DomainError'
import { Score } from '../../value-objects/Score'

// `legsToWin` / `setsToWin` : « premier à N », jamais « best-of N ».
// ⚠️ Défauts du domaine = règle standard (double out actif) ; l'écran passe toujours la valeur : ne pas les aligner.
export type X01Config = {
  readonly startingScore: Score
  readonly legsToWin: number
  readonly setsToWin: number
  readonly doubleIn: boolean
  readonly doubleOut: boolean
}

export type X01ConfigInput = {
  readonly startingScore?: number
  readonly legsToWin?: number
  readonly setsToWin?: number
  readonly doubleIn?: boolean
  readonly doubleOut?: boolean
}

const legsForBestOf = (bestOf: number): number => {
  if (!Number.isInteger(bestOf) || bestOf < 1) {
    throw new DomainError(`Best-of must be a positive integer, got ${bestOf}`)
  }
  return Math.ceil(bestOf / 2)
}

export const X01Config = {
  legsForBestOf,

  create(input: X01ConfigInput = {}): X01Config {
    const startingScore = input.startingScore ?? 501
    const legsToWin = input.legsToWin ?? legsForBestOf(3)
    const setsToWin = input.setsToWin ?? 1

    if (startingScore < 2) {
      throw new DomainError(`Starting score must be at least 2, got ${startingScore}`)
    }
    if (!Number.isInteger(legsToWin) || legsToWin < 1) {
      throw new DomainError(`legsToWin must be a positive integer, got ${legsToWin}`)
    }
    if (!Number.isInteger(setsToWin) || setsToWin < 1) {
      throw new DomainError(`setsToWin must be a positive integer, got ${setsToWin}`)
    }

    return {
      startingScore: Score.of(startingScore),
      legsToWin,
      setsToWin,
      doubleIn: input.doubleIn ?? false,
      doubleOut: input.doubleOut ?? true,
    }
  },
}
