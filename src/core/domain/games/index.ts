import { DomainError } from '../DomainError'
import type { MatchEvent } from '../events/MatchEvent'
import type { PlayerId } from '../value-objects/ids'
import { CheckoutPracticeRules, type CheckoutPracticeState } from './checkout-practice/rules'
import { CricketRules, type CricketState } from './cricket/rules'
import { KillerRules, type KillerState } from './killer/rules'
import { TourDuMondeRules, type TourDuMondeState } from './tour-du-monde/rules'
import { X01Rules, type X01State } from './x01/rules'

// Couture `GameMode` : chaque mode garde ses règles et son état, ce fichier aiguille sur `mode`.
// ⚠️ Chaque aiguillage finit par un `default` typé `never` : un mode oublié ne compile pas.
export const GAME_MODE_IDS = [
  'X01',
  'TOUR_DU_MONDE',
  'CRICKET',
  'KILLER',
  'CHECKOUT_PRACTICE',
] as const

export type GameModeId = (typeof GAME_MODE_IDS)[number]

export type AnyMatchState =
  | X01State
  | TourDuMondeState
  | CricketState
  | KillerState
  | CheckoutPracticeState

const impossible = (valeur: never): never => {
  throw new DomainError(`Unknown game mode: ${String(valeur)}`)
}

/** ⚠️ Le mode se lit sur le premier événement : `'MatchStarted'` reste du X01. */
export const modeOf = (events: readonly MatchEvent[]): GameModeId => {
  switch (events[0]?.type) {
    case 'TourDuMondeStarted':
      return 'TOUR_DU_MONDE'
    case 'CricketStarted':
      return 'CRICKET'
    case 'KillerStarted':
      return 'KILLER'
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
    const mode = modeOf(events)
    switch (mode) {
      case 'X01':
        return X01Rules.project(events)
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.project(events)
      case 'CRICKET':
        return CricketRules.project(events)
      case 'KILLER':
        return KillerRules.project(events)
      case 'CHECKOUT_PRACTICE':
        return CheckoutPracticeRules.project(events)
      default:
        return impossible(mode)
    }
  },

  isFinished: (state: AnyMatchState): boolean => {
    switch (state.mode) {
      case 'X01':
        return X01Rules.isFinished(state)
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.isFinished(state)
      case 'CRICKET':
        return CricketRules.isFinished(state)
      case 'KILLER':
        return KillerRules.isFinished(state)
      case 'CHECKOUT_PRACTICE':
        return CheckoutPracticeRules.isFinished(state)
      default:
        return impossible(state)
    }
  },

  currentPlayerId: (state: AnyMatchState): PlayerId => {
    switch (state.mode) {
      case 'X01':
        return X01Rules.currentPlayer(state).playerId
      case 'TOUR_DU_MONDE':
        return TourDuMondeRules.currentPlayer(state).playerId
      case 'CRICKET':
        return CricketRules.currentPlayer(state).playerId
      case 'KILLER':
        return KillerRules.currentPlayer(state).playerId
      case 'CHECKOUT_PRACTICE':
        return state.playerId
      default:
        return impossible(state)
    }
  },

  visitCount: (state: AnyMatchState): number =>
    state.mode === 'CHECKOUT_PRACTICE' ? state.roundsPlayed : state.history.length,

  isSolo: (mode: GameModeId): boolean => mode === 'CHECKOUT_PRACTICE',
}
