import type { TourDuMondeState } from '../../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../../domain/value-objects/Dart'

export type TourDuMondePreview = {
  /**
   * L'état **tel qu'il serait** si la volée en cours était enregistrée.
   *
   * ⚠️ À n'utiliser que pour l'affichage de la progression, de la cible courante
   * et du compteur de fléchettes : le tour de table y a déjà avancé, alors que la
   * main n'a pas encore changé. Qui joue se lit sur l'état réel, pas sur celui-ci.
   */
  readonly state: TourDuMondeState
  /** La volée est close : trois fléchettes, ou celle qui boucle le parcours. */
  readonly complete: boolean
}

/**
 * Évalue une volée de Tour du monde **sans rien écrire** — synchrone et pur,
 * comme `PreviewVisit` au X01 et `PreviewCricketVisit` au Cricket.
 *
 * Sans lui, l'écran devrait recopier la règle « toucher, c'est atteindre le
 * secteur » pour faire suivre la progression fléchette par fléchette, et surtout
 * il réclamerait une deuxième et une troisième fléchette après celle qui a
 * bouclé le tour — des fléchettes fantômes qui faussent le départage.
 */
export interface PreviewTourDuMondeVisit {
  execute(input: {
    readonly state: TourDuMondeState
    readonly darts: readonly Dart[]
  }): TourDuMondePreview
}
