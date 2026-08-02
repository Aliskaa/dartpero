import { ALL_SCORING_DARTS, Dart } from '../value-objects/Dart'

/** À points égaux, un simple est plus facile à viser qu'un triple, et qu'un double. */
const COUT_MULTIPLICATEUR = { SIMPLE: 0, TRIPLE: 1, DOUBLE: 2 } as const

/** Toutes les fléchettes marquantes, des plus grosses aux plus petites. */
export const SETUP_DARTS: readonly Dart[] = [...ALL_SCORING_DARTS].sort((a, b) => {
  const ecart = Dart.points(b) - Dart.points(a)
  if (ecart !== 0) return ecart
  return COUT_MULTIPLICATEUR[a.multiplier] - COUT_MULTIPLICATEUR[b.multiplier]
})

const chercher = (target: number, darts: number): readonly Dart[] | null => {
  if (darts === 1) {
    const exacte = SETUP_DARTS.find((dart) => Dart.points(dart) === target)
    return exacte ? [exacte] : null
  }

  for (const dart of SETUP_DARTS) {
    const reste = target - Dart.points(dart)
    if (reste <= 0) continue
    const suite = chercher(reste, darts - 1)
    if (suite) return [dart, ...suite]
  }
  return null
}

/**
 * La plus courte combinaison de fléchettes faisant exactement `target`, sans
 * contrainte de double. `null` si le total est hors d'atteinte — c'est ainsi
 * que les scores impossibles (179, 178, 176, 175, 173, 172, 169, 166, 163)
 * sont rejetés, sans avoir à les coder en dur.
 */
export const findExactScore = (target: number, maxDarts: number): readonly Dart[] | null => {
  if (target <= 0) return null
  for (let darts = 1; darts <= maxDarts; darts += 1) {
    const route = chercher(target, darts)
    if (route) return route
  }
  return null
}
