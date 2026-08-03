import { DomainError } from '../../DomainError'
import { suggestCheckout } from '../../services/checkout'

/**
 * **Checkout Practice** — l'exercice solo du lot 5b.
 *
 * On tire un reste au sort, on a trois fléchettes pour le sortir, et on
 * recommence. C'est l'entraînement qui rapporte le plus : savoir finir est ce
 * qui gagne les parties, et c'est précisément ce qu'on rate le plus.
 */
export type CheckoutPracticeConfig = {
  /** Nombre de manches dans une session. */
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

/**
 * 41, parce qu'en dessous une seule fléchette suffit (40 = D20) : ce ne serait
 * plus un exercice de sortie mais de visée. 170, c'est le maximum théorique.
 */
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

/**
 * Les restes réellement jouables, **calculés et non tabulés**.
 *
 * On garde ceux qu'une route de trois fléchettes peut clore : les bogey numbers
 * (169, 168, 166, 165, 163, 162, 159) s'excluent donc tout seuls. Proposer un
 * reste impossible à finir serait un exercice injuste, et coder la liste en dur
 * la ferait diverger le jour où l'on change les options de sortie.
 */
export const playableTargets = (config: CheckoutPracticeConfig): readonly number[] => {
  const cibles: number[] = []
  for (let reste = config.minTarget; reste <= config.maxTarget; reste += 1) {
    if (suggestCheckout(reste, 3, { doubleOut: true })) cibles.push(reste)
  }
  return cibles
}
