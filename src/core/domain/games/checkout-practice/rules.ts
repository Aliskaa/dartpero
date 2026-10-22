import { DomainError } from '../../DomainError'
import type { VisitOutcome } from '../../entities/Visit'
import type { CheckoutPracticeStarted, MatchEvent } from '../../events/MatchEvent'
import { resolveVisit } from '../../services/visitOutcome'
import type { Dart } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import type { CheckoutPracticeConfig } from './config'

// Toujours en `double out`.
const SORTIE = { doubleOut: true, doubleIn: false } as const

export type CheckoutRound = {
  readonly target: number
  /** Tronqué à la fléchette qui sort. */
  readonly darts: readonly Dart[]
  /** `null` tant que la manche est en cours. */
  readonly outcome: VisitOutcome | null
  readonly remaining: number
}

export type CheckoutPracticeState = {
  readonly mode: 'CHECKOUT_PRACTICE'
  readonly config: CheckoutPracticeConfig
  readonly playerId: PlayerId
  readonly rounds: readonly CheckoutRound[]
  /** `null` entre deux manches et à la fin. */
  readonly current: CheckoutRound | null
  readonly roundsWon: number
  readonly roundsPlayed: number
  readonly dartsThrown: number
  readonly finished: boolean
  /** 0-100, brute. */
  readonly successPercent: number
}

const cloturee = (round: CheckoutRound): boolean => round.outcome !== null

const start = (event: CheckoutPracticeStarted): CheckoutPracticeState => {
  const { config, playerIds } = event

  if (playerIds.length !== 1) {
    throw new DomainError('Checkout practice is a solo exercise: exactly one player')
  }
  const playerId = playerIds[0]
  if (!playerId) throw new DomainError('Checkout practice needs a player')

  return {
    mode: 'CHECKOUT_PRACTICE',
    config,
    playerId,
    rounds: [],
    current: null,
    roundsWon: 0,
    roundsPlayed: 0,
    dartsThrown: 0,
    finished: false,
    successPercent: 0,
  }
}

const recalculer = (
  state: CheckoutPracticeState,
  rounds: readonly CheckoutRound[],
  current: CheckoutRound | null,
): CheckoutPracticeState => {
  const jouees = rounds.filter(cloturee)
  const gagnees = jouees.filter((round) => round.outcome === 'CHECKOUT').length
  const flechettes = rounds.reduce((total, round) => total + round.darts.length, 0)

  return {
    ...state,
    rounds,
    current,
    roundsWon: gagnees,
    roundsPlayed: jouees.length,
    dartsThrown: flechettes,
    finished: jouees.length >= state.config.rounds,
    successPercent: jouees.length === 0 ? 0 : (gagnees / jouees.length) * 100,
  }
}

const openRound = (state: CheckoutPracticeState, target: number): CheckoutPracticeState => {
  if (state.finished) throw new DomainError('Session is already finished')
  if (state.current !== null) throw new DomainError('A round is already open')

  const round: CheckoutRound = { target, darts: [], outcome: null, remaining: target }
  return recalculer(state, [...state.rounds, round], round)
}

// Même `resolveVisit` que le X01 : une manche est ratée pour les mêmes raisons qu'en partie.
const applyVisit = (
  state: CheckoutPracticeState,
  darts: readonly Dart[],
): CheckoutPracticeState => {
  if (state.finished) throw new DomainError('Session is already finished')
  if (darts.length < 1 || darts.length > 3) {
    throw new DomainError(`A visit holds 1 to 3 darts, got ${darts.length}`)
  }

  const encours = state.current
  if (!encours) throw new DomainError('No round is open')

  const resolution = resolveVisit(SORTIE, encours.remaining, true, darts)
  const lancees = [...encours.darts, ...darts.slice(0, resolution.dartsUsed)]

  // Une manche = une seule volée, quelle qu'en soit l'issue.
  const termine: CheckoutRound = {
    ...encours,
    darts: lancees,
    outcome: resolution.outcome,
    remaining: resolution.remainingAfter,
  }

  const rounds = state.rounds.map((round) => (round === encours ? termine : round))
  return recalculer(state, rounds, null)
}

/** Rejoue le journal ; l'annulation est `project(events.slice(0, -1))` (le reste tiré est au journal). */
const project = (events: readonly MatchEvent[]): CheckoutPracticeState => {
  const [first, ...rest] = events
  if (first === undefined || first.type !== 'CheckoutPracticeStarted') {
    throw new DomainError('A checkout practice log must start with CheckoutPracticeStarted')
  }

  let state = start(first)
  for (const event of rest) {
    if (event.type === 'RoundStarted') state = openRound(state, event.target)
    else if (event.type === 'VisitRecorded') state = applyVisit(state, event.darts)
    else throw new DomainError(`Unexpected event in a checkout practice log: ${event.type}`)
  }
  return state
}

export const CheckoutPracticeRules = {
  start,
  openRound,
  applyVisit,
  project,
  isFinished: (state: CheckoutPracticeState): boolean => state.finished,
  needsRound: (state: CheckoutPracticeState): boolean => !state.finished && state.current === null,
}
