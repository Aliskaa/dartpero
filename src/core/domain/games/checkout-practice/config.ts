import { DomainError } from '../../DomainError'
import { suggestCheckout } from '../../services/checkout'

export type CheckoutPracticeConfig = {
  readonly rounds: number
  /** Bornes du tirage, incluses. */
  readonly minTarget: number
  readonly maxTarget: number
}

export type CheckoutPracticeConfigInput = {
  readonly rounds?: number
  readonly minTarget?: number
  readonly maxTarget?: number
}

// 41 : en dessous une seule fléchette suffit (40 = D20). 170 : le maximum théorique.
export const DEFAUT: CheckoutPracticeConfig = {
  rounds: 10,
  minTarget: 41,
  maxTarget: 170,
}

export const CheckoutPracticeConfig = {
  create({
    rounds = DEFAUT.rounds,
    minTarget = DEFAUT.minTarget,
    maxTarget = DEFAUT.maxTarget,
  }: CheckoutPracticeConfigInput = {}): CheckoutPracticeConfig {
    if (!Number.isInteger(rounds) || rounds < 1) {
      throw new DomainError(`rounds must be a positive integer, got ${rounds}`)
    }
    if (minTarget < 2 || maxTarget < minTarget) {
      throw new DomainError(`invalid target range: ${minTarget}-${maxTarget}`)
    }
    return { rounds, minTarget, maxTarget }
  },
}

/** Restes jouables, calculés et non tabulés : les bogey numbers s'excluent d'eux-mêmes. */
export const playableTargets = (config: CheckoutPracticeConfig): readonly number[] => {
  const cibles: number[] = []
  for (let reste = config.minTarget; reste <= config.maxTarget; reste += 1) {
    if (suggestCheckout(reste, 3, { doubleOut: true })) cibles.push(reste)
  }
  return cibles
}
