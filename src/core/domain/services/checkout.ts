import { DomainError } from '../DomainError'
import { Dart, type SegmentNumber } from '../value-objects/Dart'
import { SETUP_DARTS } from './dartSearch'

/** Plus étroit que `X01Config` : le module reste transverse (X01 et entraînement). */
export type SortieRules = {
  readonly doubleOut: boolean
}

/** Checkout maximal en 3 fléchettes, sur un double : T20 · T20 · Bull. */
export const MAX_CHECKOUT = 170

/** Checkout maximal en 3 fléchettes, en sortie libre : T20 · T20 · T20. */
export const MAX_CHECKOUT_FREE_OUT = 180

/** Référence de test : l'algorithme ne la lit pas, `checkout.test.ts` vérifie l'accord. */
export const BOGEY_NUMBERS: readonly number[] = [169, 168, 166, 165, 163, 162, 159]

/** Référence de test, comme `BOGEY_NUMBERS`. */
export const FREE_OUT_NO_FINISH: readonly number[] = [179, 178, 176, 175, 173, 172, 169, 166, 163]

export type CheckoutRange = {
  readonly max: number
  readonly noFinish: readonly number[]
}

export const checkoutRange = (config: SortieRules): CheckoutRange =>
  config.doubleOut
    ? { max: MAX_CHECKOUT, noFinish: BOGEY_NUMBERS }
    : { max: MAX_CHECKOUT_FREE_OUT, noFinish: FREE_OUT_NO_FINISH }

// Préférence : puissances de 2 (D20, D16, D8…), puis pairs, puis impairs, bullseye en dernier.
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

const finishEnDeux = (target: number, finishers: readonly Dart[]): readonly Dart[] | null => {
  // Deux passes : un double n'est fléchette d'approche que faute d'autre route.
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

/** Route légale la plus courte, ou `null`. ⚠️ Pas la table PDC : toujours valide mais peut différer. */
export const suggestCheckout = (
  remaining: number,
  dartsLeft: number,
  config: SortieRules,
): readonly Dart[] | null => {
  if (!Number.isInteger(dartsLeft) || dartsLeft < 1 || dartsLeft > 3) {
    throw new DomainError(`dartsLeft must be between 1 and 3, got ${dartsLeft}`)
  }
  // Sur un double, 1 est infinissable ; en sortie libre, un simple 1 le sort.
  if (remaining < (config.doubleOut ? 2 : 1)) return null
  if (remaining > checkoutRange(config).max) return null

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

/** Reste qu'une seule fléchette peut clore (tentative de double des stats). */
export const isOnACheckoutDouble = (remaining: number, config: SortieRules): boolean => {
  if (!config.doubleOut) return false
  if (remaining === 50) return true
  return remaining >= 2 && remaining <= 40 && remaining % 2 === 0
}
