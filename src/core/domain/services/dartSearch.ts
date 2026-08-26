import { ALL_SCORING_DARTS, Dart } from '../value-objects/Dart'

/** À points égaux, un simple est plus facile à viser qu'un triple, et qu'un double. */
const COUT_MULTIPLICATEUR = { SIMPLE: 0, TRIPLE: 1, DOUBLE: 2 } as const

/** Toutes les fléchettes marquantes, des plus grosses aux plus petites. */
export const SETUP_DARTS: readonly Dart[] = [...ALL_SCORING_DARTS].sort((a, b) => {
  const ecart = Dart.points(b) - Dart.points(a)
  if (ecart !== 0) return ecart
  return COUT_MULTIPLICATEUR[a.multiplier] - COUT_MULTIPLICATEUR[b.multiplier]
})

/*
 * ⚠️ `findExactScore` vivait ici — la recherche d'une combinaison faisant
 * exactement un total, sans contrainte de double. Elle ne servait qu'à la
 * saisie rapide, retirée du projet : sa seule cliente partie, elle aussi.
 * `SETUP_DARTS` reste, c'est l'espace de recherche des sorties.
 */
