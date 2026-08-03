import { DomainError } from '../DomainError'
import type { MatchEvent } from '../events/MatchEvent'
import type { PlayerId } from '../value-objects/ids'
import { CheckoutPracticeRules, type CheckoutPracticeState } from './checkout-practice/rules'
import { TourDuMondeRules, type TourDuMondeState } from './tour-du-monde/rules'
import { X01Rules, type X01State } from './x01/rules'

/**
 * LA COUTURE `GameMode` — annoncée dès le lot 1, écrite au lot 5a seulement,
 * quand un deuxième mode réel est arrivé. Généraliser plus tôt aurait été
 * inventer une abstraction sans savoir ce qu'elle devait abstraire.
 *
 * Le principe : chaque mode garde **ses propres règles et son propre état**,
 * complets et lisibles, sans dénominateur commun artificiel. Ce fichier ne fait
 * qu'aiguiller, sur le discriminant `mode` que porte chaque état. TypeScript
 * garantit alors qu'aucun cas n'est oublié.
 *
 * Le troisième mode (l'entraînement au checkout, lot 5b) a coûté exactement ce
 * qui était annoncé : un dossier, un événement d'ouverture, trois lignes ici.
 */
export const GAME_MODE_IDS = ['X01', 'TOUR_DU_MONDE', 'CHECKOUT_PRACTICE'] as const

export type GameModeId = (typeof GAME_MODE_IDS)[number]

/** L'état d'une partie, quel que soit son mode. */
export type AnyMatchState = X01State | TourDuMondeState | CheckoutPracticeState

/**
 * Le mode se lit sur le **premier événement du journal**, jamais sur un champ
 * ajouté après coup : les parties d'avant le lot 5a portent `'MatchStarted'` et
 * se rejouent en X01 pour toujours, sans migration.
 */
export const modeOf = (events: readonly MatchEvent[]): GameModeId => {
  switch (events[0]?.type) {
    case 'TourDuMondeStarted':
      return 'TOUR_DU_MONDE'
    case 'CheckoutPracticeStarted':
      return 'CHECKOUT_PRACTICE'
    case 'MatchStarted':
      return 'X01'
    default:
      throw new DomainError('A match log must start with an opening event')
  }
}

export const GameModes = {
  modeOf,

  project: (events: readonly MatchEvent[]): AnyMatchState => {
    switch (modeOf(events)) {
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.project(events)
      case 'CHECKOUT_PRACTICE':
        return CheckoutPracticeRules.project(events)
      default:
        return X01Rules.project(events)
    }
  },

  isFinished: (state: AnyMatchState): boolean => {
    switch (state.mode) {
      case 'X01':
        return X01Rules.isFinished(state)
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.isFinished(state)
      default:
        return CheckoutPracticeRules.isFinished(state)
    }
  },

  currentPlayerId: (state: AnyMatchState): PlayerId => {
    switch (state.mode) {
      case 'X01':
        return X01Rules.currentPlayer(state).playerId
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.currentPlayer(state).playerId
      default:
        // Exercice solo : il n'y a jamais qu'un joueur.
        return state.playerId
    }
  },

  /** Le nombre de volées enregistrées, commun à tous les modes. */
  visitCount: (state: AnyMatchState): number =>
    state.mode === 'CHECKOUT_PRACTICE' ? state.roundsPlayed : state.history.length,

  /** Un exercice solo n'a pas d'adversaire : il ne se « gagne » pas. */
  isSolo: (mode: GameModeId): boolean => mode === 'CHECKOUT_PRACTICE',
}
