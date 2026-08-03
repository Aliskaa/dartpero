import { DomainError } from '../DomainError'
import type { MatchEvent } from '../events/MatchEvent'
import type { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import { TourDuMondeRules, type TourDuMondeState } from './tourDuMondeRules'
import { type MatchState, X01Rules } from './x01Rules'

/**
 * LA COUTURE `GameMode` — annoncée dès le lot 1, écrite au lot 5 seulement,
 * quand un deuxième mode réel est arrivé. Généraliser plus tôt aurait été
 * inventer une abstraction sans savoir ce qu'elle devait abstraire.
 *
 * Le principe : chaque mode garde **ses propres règles et son propre état**,
 * complets et lisibles, sans dénominateur commun artificiel. Ce fichier ne fait
 * qu'aiguiller, sur le discriminant `mode` que porte chaque état. TypeScript
 * garantit alors qu'aucun cas n'est oublié.
 *
 * Le Cricket, s'il arrive un jour, s'ajoute ici : un événement d'ouverture, un
 * module de règles, trois lignes dans chaque aiguillage.
 */
export const GAME_MODE_IDS = ['X01', 'TOUR_DU_MONDE'] as const

export type GameModeId = (typeof GAME_MODE_IDS)[number]

/** L'état d'une partie, quel que soit son mode. */
export type AnyMatchState = MatchState | TourDuMondeState

/**
 * Le mode se lit sur le **premier événement du journal**, jamais sur un champ
 * ajouté après coup : les parties d'avant le lot 5 disent `MatchStarted` et se
 * rejouent en X01 pour toujours, sans migration.
 */
export const modeOf = (events: readonly MatchEvent[]): GameModeId => {
  const first = events[0]
  if (first?.type === 'TourDuMondeStarted') return 'TOUR_DU_MONDE'
  if (first?.type === 'MatchStarted') return 'X01'
  throw new DomainError('A match log must start with an opening event')
}

export const GameModes = {
  modeOf,

  project: (events: readonly MatchEvent[]): AnyMatchState =>
    modeOf(events) === 'TOUR_DU_MONDE'
      ? TourDuMondeRules.project(events)
      : X01Rules.project(events),

  isFinished: (state: AnyMatchState): boolean =>
    state.mode === 'X01' ? X01Rules.isFinished(state) : TourDuMondeRules.isFinished(state),

  currentPlayerId: (state: AnyMatchState): PlayerId =>
    state.mode === 'X01'
      ? X01Rules.currentPlayer(state).playerId
      : TourDuMondeRules.currentPlayer(state).playerId,

  applyVisit: (state: AnyMatchState, darts: readonly Dart[]): AnyMatchState =>
    state.mode === 'X01'
      ? X01Rules.applyVisit(state, darts)
      : TourDuMondeRules.applyVisit(state, darts),

  /** Le nombre de volées déjà enregistrées, commun à tous les modes. */
  visitCount: (state: AnyMatchState): number => state.history.length,
}
