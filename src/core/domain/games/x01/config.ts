import { DomainError } from '../../DomainError'
import { Score } from '../../value-objects/Score'

/**
 * Configuration d'un match X01.
 *
 * `legsToWin` / `setsToWin` sont stockés en « premier à N » plutôt qu'en
 * « best-of N » : c'est la forme dont les règles ont besoin, et elle ne se
 * prête pas aux erreurs d'arrondi. `X01Config.legsForBestOf` ne sert plus
 * qu'au défaut ci-dessous et à ses tests : aucun écran ne l'appelle.
 *
 * Défauts du domaine = la règle standard (501, premier à 2, 1 set, double
 * out). L'écran de création propose double out désactivé et passe toujours la
 * valeur. Ne pas aligner l'un sur l'autre.
 */
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

/** Best-of 3 → premier à 2. Best-of 5 → premier à 3. */
const legsForBestOf = (bestOf: number): number => {
  if (!Number.isInteger(bestOf) || bestOf < 1) {
    throw new DomainError(`Best-of must be a positive integer, got ${bestOf}`)
  }
  return Math.ceil(bestOf / 2)
}

export const X01Config = {
  legsForBestOf,

  /**
   * Défauts du domaine = la règle standard (501, premier à 2, 1 set, double
   * out). L'écran de création propose double out désactivé et passe toujours
   * la valeur. Ne pas aligner l'un sur l'autre.
   */
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
