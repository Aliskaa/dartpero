import type { CricketState } from '../../../domain/games/cricket/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type CricketPreview = {
  /**
   * L'état **tel qu'il serait** si la volée en cours était enregistrée.
   *
   * ⚠️ À n'utiliser que pour l'affichage des marques et des points : le tour de
   * table y a déjà avancé, alors que la main n'a pas encore changé. Qui joue se
   * lit sur l'état réel, pas sur celui-ci.
   */
  readonly state: CricketState
  /** La volée est close : trois fléchettes, ou la partie vient d'être gagnée. */
  readonly complete: boolean
}

/**
 * Évalue une volée de Cricket **sans rien écrire** — synchrone et pur, comme
 * `PreviewVisit` au X01.
 *
 * Sans lui, l'écran devrait recopier le comptage des marques pour faire suivre
 * le tableau fléchette par fléchette, et surtout il ne saurait pas qu'une
 * partie vient d'être gagnée : il réclamerait une troisième fléchette après
 * celle qui a conclu.
 */
export interface PreviewCricketVisit {
  execute(input: { readonly state: CricketState; readonly darts: readonly Dart[] }): CricketPreview
}
