export interface Clock {
  /** Millisecondes depuis l'epoch. */
  now(): number
}
