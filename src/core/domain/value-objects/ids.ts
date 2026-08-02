import { DomainError } from '../DomainError'

/** Marque un type primitif pour empêcher qu'on le confonde avec un autre. */
export type Branded<T, B extends string> = T & { readonly __brand: B }

export type MatchId = Branded<string, 'MatchId'>
export type PlayerId = Branded<string, 'PlayerId'>
export type LegId = Branded<string, 'LegId'>

const nonVide = (value: string, label: string): string => {
  if (value.trim() === '') throw new DomainError(`${label} cannot be empty`)
  return value
}

export const MatchId = {
  of: (value: string): MatchId => nonVide(value, 'MatchId') as MatchId,
}

export const PlayerId = {
  of: (value: string): PlayerId => nonVide(value, 'PlayerId') as PlayerId,
}

export const LegId = {
  of: (value: string): LegId => nonVide(value, 'LegId') as LegId,
}
