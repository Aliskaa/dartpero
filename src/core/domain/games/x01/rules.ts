import { DomainError } from '../../DomainError'
import type { Visit, VisitOutcome } from '../../entities/Visit'
import type { MatchEvent, X01Milestone, X01Started } from '../../events/MatchEvent'
import { Dart } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import { Score } from '../../value-objects/Score'
import type { X01Config } from './config'

export type X01PlayerState = {
  readonly playerId: PlayerId
  readonly remaining: Score
  /** `double in` : le joueur a-t-il déjà touché un double ? Toujours vrai sinon. */
  readonly hasOpened: boolean
  readonly dartsThrownInLeg: number
  readonly legsWonInSet: number
  readonly setsWon: number
}

export type X01State = {
  /** Le discriminant de la couture `GameMode` : il rend l'union d'états sûre. */
  readonly mode: 'X01'
  readonly config: X01Config
  readonly players: readonly X01PlayerState[]
  readonly currentPlayerIndex: number
  readonly startingPlayerIndex: number
  /** Numéro de leg global (0-based), tous sets confondus. */
  readonly legNumber: number
  readonly setNumber: number
  readonly winnerId: PlayerId | null
  readonly history: readonly Visit[]
  readonly milestones: readonly X01Milestone[]
}

const at = <T>(items: readonly T[], index: number, label: string): T => {
  const item = items[index]
  if (item === undefined) throw new DomainError(`${label}: no entry at index ${index}`)
  return item
}

type Resolution = {
  readonly outcome: VisitOutcome
  readonly scored: number
  readonly remainingAfter: number
  readonly hasOpenedAfter: boolean
  readonly dartsUsed: number
}

/**
 * Bust : la volée entière est annulée et le score revient à sa valeur d'avant
 * la visite. L'ouverture (`double in`) est annulée elle aussi — la visite n'a
 * pas eu lieu, donc le double d'ouverture non plus.
 */
const bust = (remainingBefore: number, hasOpened: boolean, dartsUsed: number): Resolution => ({
  outcome: 'BUSTED',
  scored: 0,
  remainingAfter: remainingBefore,
  hasOpenedAfter: hasOpened,
  dartsUsed,
})

/**
 * Le cœur des règles X01. Voir la spécification dans CLAUDE.md.
 *
 * Bust si : reste < 0, reste == 1 (infinissable sur un double), ou reste == 0
 * sans que la dernière fléchette soit un double.
 */
const resolveVisit = (
  config: X01Config,
  remainingBefore: number,
  hasOpened: boolean,
  darts: readonly Dart[],
): Resolution => {
  let current = remainingBefore
  let opened = hasOpened
  let dartsUsed = 0

  for (const dart of darts) {
    dartsUsed += 1

    // Double in : tant qu'aucun double n'a été touché, la fléchette est perdue.
    if (config.doubleIn && !opened) {
      if (!Dart.isDouble(dart)) continue
      opened = true
    }

    const next = current - Dart.points(dart)

    if (next < 0) return bust(remainingBefore, hasOpened, dartsUsed)

    if (next === 0) {
      if (!config.doubleOut || Dart.isDouble(dart)) {
        return {
          outcome: 'CHECKOUT',
          scored: remainingBefore,
          remainingAfter: 0,
          hasOpenedAfter: opened,
          dartsUsed,
        }
      }
      return bust(remainingBefore, hasOpened, dartsUsed)
    }

    if (next === 1 && config.doubleOut) return bust(remainingBefore, hasOpened, dartsUsed)

    current = next
  }

  return {
    outcome: 'SCORED',
    scored: remainingBefore - current,
    remainingAfter: current,
    hasOpenedAfter: opened,
    dartsUsed,
  }
}

const start = (event: X01Started): X01State => {
  const { config, playerIds, startingPlayerIndex } = event

  if (playerIds.length < 1) throw new DomainError('A match needs at least one player')
  if (new Set(playerIds).size !== playerIds.length) {
    throw new DomainError('A player cannot appear twice in the same match')
  }
  if (
    !Number.isInteger(startingPlayerIndex) ||
    startingPlayerIndex < 0 ||
    startingPlayerIndex >= playerIds.length
  ) {
    throw new DomainError(`startingPlayerIndex out of range: ${startingPlayerIndex}`)
  }

  return {
    mode: 'X01',
    config,
    players: playerIds.map((playerId) => ({
      playerId,
      remaining: config.startingScore,
      hasOpened: !config.doubleIn,
      dartsThrownInLeg: 0,
      legsWonInSet: 0,
      setsWon: 0,
    })),
    currentPlayerIndex: startingPlayerIndex,
    startingPlayerIndex,
    legNumber: 0,
    setNumber: 0,
    winnerId: null,
    history: [],
    milestones: [],
  }
}

const applyVisit = (state: X01State, darts: readonly Dart[]): X01State => {
  if (state.winnerId !== null) throw new DomainError('Match is already finished')
  if (darts.length < 1 || darts.length > 3) {
    throw new DomainError(`A visit holds 1 to 3 darts, got ${darts.length}`)
  }

  const index = state.currentPlayerIndex
  const player = at(state.players, index, 'players')
  const resolution = resolveVisit(state.config, player.remaining, player.hasOpened, darts)

  const visit: Visit = {
    playerId: player.playerId,
    darts: darts.slice(0, resolution.dartsUsed),
    outcome: resolution.outcome,
    scored: resolution.scored,
    remainingBefore: player.remaining,
    remainingAfter: Score.of(resolution.remainingAfter),
    legNumber: state.legNumber,
  }

  const afterVisit: X01PlayerState = {
    ...player,
    remaining: Score.of(resolution.remainingAfter),
    hasOpened: resolution.hasOpenedAfter,
    dartsThrownInLeg: player.dartsThrownInLeg + resolution.dartsUsed,
  }

  const history = [...state.history, visit]
  const players = state.players.map((p, i) => (i === index ? afterVisit : p))

  if (resolution.outcome !== 'CHECKOUT') {
    return {
      ...state,
      players,
      currentPlayerIndex: (index + 1) % players.length,
      history,
    }
  }

  // ---- Le leg est gagné ----
  const milestones: X01Milestone[] = [
    {
      type: 'LegWon',
      playerId: player.playerId,
      legNumber: state.legNumber,
      dartsUsed: afterVisit.dartsThrownInLeg,
    },
  ]

  let scoreboard = players.map((p, i) =>
    i === index ? { ...p, legsWonInSet: p.legsWonInSet + 1 } : p,
  )
  let setNumber = state.setNumber
  let winnerId: PlayerId | null = null

  if (at(scoreboard, index, 'players').legsWonInSet >= state.config.legsToWin) {
    milestones.push({ type: 'SetWon', playerId: player.playerId, setNumber })
    scoreboard = scoreboard.map((p, i) => ({
      ...p,
      legsWonInSet: 0,
      setsWon: i === index ? p.setsWon + 1 : p.setsWon,
    }))

    if (at(scoreboard, index, 'players').setsWon >= state.config.setsToWin) {
      winnerId = player.playerId
      milestones.push({ type: 'MatchFinished', winnerId })
    } else {
      setNumber += 1
    }
  }

  const allMilestones = [...state.milestones, ...milestones]

  if (winnerId !== null) {
    return {
      ...state,
      players: scoreboard,
      history,
      milestones: allMilestones,
      winnerId,
      setNumber,
    }
  }

  // Leg suivant : tout le monde repart du score de départ, et le départ tourne.
  const legNumber = state.legNumber + 1
  return {
    ...state,
    players: scoreboard.map((p) => ({
      ...p,
      remaining: state.config.startingScore,
      hasOpened: !state.config.doubleIn,
      dartsThrownInLeg: 0,
    })),
    currentPlayerIndex: (state.startingPlayerIndex + legNumber) % scoreboard.length,
    legNumber,
    setNumber,
    history,
    milestones: allMilestones,
  }
}

/**
 * Rejoue le journal et renvoie l'état courant.
 *
 * C'est aussi l'implémentation de l'annulation : `project(events.slice(0, -1))`.
 */
const project = (events: readonly MatchEvent[]): X01State => {
  const [first, ...rest] = events
  if (first === undefined || first.type !== 'MatchStarted') {
    throw new DomainError('A match log must start with MatchStarted')
  }

  let state = start(first)
  for (const event of rest) {
    // Un journal n'a qu'un seul événement d'ouverture, quel que soit le mode :
    // tout le reste est une volée.
    if (event.type !== 'VisitRecorded') {
      throw new DomainError(`A match log holds a single opening event, got ${event.type}`)
    }
    state = applyVisit(state, event.darts)
  }
  return state
}

export const X01Rules = {
  start,
  applyVisit,
  project,
  resolveVisit,
  currentPlayer: (state: X01State): X01PlayerState =>
    at(state.players, state.currentPlayerIndex, 'players'),
  isFinished: (state: X01State): boolean => state.winnerId !== null,
}
