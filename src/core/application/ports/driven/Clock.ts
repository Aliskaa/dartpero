/**
 * Le temps, vu du cœur. Existe pour que le domaine et les use cases n'appellent
 * jamais `Date.now()` directement : les tests injectent une horloge figée.
 */
export interface Clock {
  /** Millisecondes depuis l'epoch. */
  now(): number
}
