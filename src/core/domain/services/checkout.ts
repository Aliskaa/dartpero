import { DomainError } from '../DomainError'
import { Dart, type SegmentNumber } from '../value-objects/Dart'
import { SETUP_DARTS } from './dartSearch'

/**
 * Sortir sur un double : la seule règle dont le calcul de checkout a besoin.
 *
 * Volontairement plus étroit que `X01Config` — ainsi ce module reste
 * **transverse** et peut servir aussi bien au X01 qu'à l'entraînement au
 * checkout, sans qu'un mode de jeu en importe un autre.
 */
export type SortieRules = {
  readonly doubleOut: boolean
}

/** Checkout maximal en 3 fléchettes : T20 · T20 · Bull. */
export const MAX_CHECKOUT = 170

/**
 * Les « bogey numbers » : impossibles à finir en 3 fléchettes malgré un reste
 * ≤ 170. L'app doit afficher « pas de finish » plutôt qu'une suggestion bidon.
 *
 * Cette liste est une **référence de test** : l'algorithme ne la consulte pas,
 * il les redécouvre. `checkout.test.ts` vérifie que les deux sont d'accord.
 */
export const BOGEY_NUMBERS: readonly number[] = [169, 168, 166, 165, 163, 162, 159]

/**
 * Ordre de préférence des doubles de sortie : la « route en puissances de 2 »
 * (D20 → D16 → D8 → D4 → D2 → D1), puis les autres doubles pairs, puis les
 * impairs, et le bullseye en dernier (c'est la cible la plus petite).
 */
const DOUBLE_PREFERENCE: readonly SegmentNumber[] = [
  20, 16, 8, 4, 2, 1, 18, 12, 10, 6, 14, 19, 17, 15, 13, 11, 9, 7, 5, 3,
]

const FINISHING_DOUBLES: readonly Dart[] = [
  ...DOUBLE_PREFERENCE.map((segment) => Dart.double(segment)),
  Dart.bullseye(),
]

const ORDERED_FINISHERS = (config: SortieRules): readonly Dart[] =>
  config.doubleOut ? FINISHING_DOUBLES : SETUP_DARTS

const setupPour = (points: number, autoriserDouble: boolean): Dart | undefined =>
  SETUP_DARTS.find(
    (dart) => Dart.points(dart) === points && (autoriserDouble || dart.multiplier !== 'DOUBLE'),
  )

/** Sortie en 2 fléchettes : on choisit d'abord le double, puis de quoi l'amener. */
const finishEnDeux = (target: number, finishers: readonly Dart[]): readonly Dart[] | null => {
  // Deux passes : on évite de proposer un double comme fléchette d'approche,
  // sauf s'il n'existe aucune autre route.
  for (const autoriserDouble of [false, true]) {
    for (const final of finishers) {
      const reste = target - Dart.points(final)
      if (reste <= 0) continue
      const setup = setupPour(reste, autoriserDouble)
      if (setup) return [setup, final]
    }
  }
  return null
}

/**
 * Chemin de sortie conseillé, ou `null` s'il n'y en a pas.
 *
 * Stratégie : la route **légale la plus courte**. En 3 fléchettes, on marque
 * gros d'abord puis on cherche la meilleure sortie en 2 ; en 2 fléchettes, on
 * choisit le double le plus confortable et on l'amène.
 *
 * ⚠️ Ce n'est pas la table professionnelle : la route proposée est toujours
 * valide et laisse un double usuel, mais elle peut différer de la table PDC.
 */
export const suggestCheckout = (
  remaining: number,
  dartsLeft: number,
  config: SortieRules,
): readonly Dart[] | null => {
  if (!Number.isInteger(dartsLeft) || dartsLeft < 1 || dartsLeft > 3) {
    throw new DomainError(`dartsLeft must be between 1 and 3, got ${dartsLeft}`)
  }
  if (remaining < 2) return null
  if (remaining > (config.doubleOut ? MAX_CHECKOUT : 180)) return null

  const finishers = ORDERED_FINISHERS(config)

  // 1 fléchette : il faut tomber pile sur une sortie valide.
  const enUne = finishers.find((dart) => Dart.points(dart) === remaining)
  if (enUne) return [enUne]
  if (dartsLeft === 1) return null

  const enDeux = finishEnDeux(remaining, finishers)
  if (enDeux) return enDeux
  if (dartsLeft === 2) return null

  // 3 fléchettes : marquer le plus gros possible, puis sortir en 2.
  for (const setup of SETUP_DARTS) {
    const reste = remaining - Dart.points(setup)
    if (reste <= 1) continue
    const suite = finishEnDeux(reste, finishers)
    if (suite) return [setup, ...suite]
  }

  return null
}

/**
 * Le joueur est-il « sur un double », c'est-à-dire à un reste qu'une seule
 * fléchette peut clore ? Sert à compter les tentatives de double dans les stats.
 */
export const isOnACheckoutDouble = (remaining: number, config: SortieRules): boolean => {
  if (!config.doubleOut) return false
  if (remaining === 50) return true
  return remaining >= 2 && remaining <= 40 && remaining % 2 === 0
}
