import { DomainError } from '../../DomainError'
import type { CricketStarted, MatchEvent } from '../../events/MatchEvent'
import type { Dart, Segment } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import { type CricketConfig, MARKS_TO_CLOSE, targetValue } from './config'

export type CricketPlayerState = {
  readonly playerId: PlayerId
  /** Dans l'ordre de `config.targets`. */
  readonly marks: readonly number[]
  readonly score: number
  readonly dartsThrown: number
}

export type CricketVisit = {
  readonly playerId: PlayerId
  /** Tronquée à la fléchette qui gagne. */
  readonly darts: readonly Dart[]
  readonly marks: number
  /** ⚠️ En cut-throat ces points vont aux adversaires, pas au lanceur. */
  readonly points: number
  readonly closed: readonly Segment[]
}

export type CricketMilestone =
  | { readonly type: 'TargetClosed'; readonly playerId: PlayerId; readonly target: Segment }
  | { readonly type: 'MatchFinished'; readonly winnerId: PlayerId }

export type CricketState = {
  readonly mode: 'CRICKET'
  readonly config: CricketConfig
  readonly players: readonly CricketPlayerState[]
  readonly currentPlayerIndex: number
  readonly startingPlayerIndex: number
  readonly winnerId: PlayerId | null
  readonly finished: boolean
  readonly history: readonly CricketVisit[]
  readonly milestones: readonly CricketMilestone[]
}

const at = <T>(items: readonly T[], index: number, label: string): T => {
  const item = items[index]
  if (item === undefined) throw new DomainError(`${label}: no entry at index ${index}`)
  return item
}

// Le bullseye vaut deux marques (c'est un double).
const marksOf = (dart: Dart): number =>
  dart.multiplier === 'TRIPLE' ? 3 : dart.multiplier === 'DOUBLE' ? 2 : 1

const closedAll = (player: CricketPlayerState): boolean =>
  player.marks.every((marks) => marks >= MARKS_TO_CLOSE)

/** Tout fermé et devant (derrière en cut-throat). ⚠️ L'égalité au score suffit (`>=`, `<=`). */
const wins = (
  player: CricketPlayerState,
  players: readonly CricketPlayerState[],
  config: CricketConfig,
): boolean => {
  if (!closedAll(player)) return false

  return players
    .filter((other) => other.playerId !== player.playerId)
    .every((other) =>
      config.variant === 'CUT_THROAT' ? player.score <= other.score : player.score >= other.score,
    )
}

const start = (event: CricketStarted): CricketState => {
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
    mode: 'CRICKET',
    config,
    players: playerIds.map((playerId) => ({
      playerId,
      marks: config.targets.map(() => 0),
      score: 0,
      dartsThrown: 0,
    })),
    currentPlayerIndex: startingPlayerIndex,
    startingPlayerIndex,
    winnerId: null,
    finished: false,
    history: [],
    milestones: [],
  }
}

type Brouillon = {
  playerId: PlayerId
  marks: number[]
  score: number
  dartsThrown: number
}

const applyVisit = (state: CricketState, darts: readonly Dart[]): CricketState => {
  if (state.finished) throw new DomainError('Match is already finished')
  if (darts.length < 1 || darts.length > 3) {
    throw new DomainError(`A visit holds 1 to 3 darts, got ${darts.length}`)
  }

  const { targets, variant } = state.config
  const index = state.currentPlayerIndex
  const brouillons: Brouillon[] = state.players.map((player) => ({
    playerId: player.playerId,
    marks: [...player.marks],
    score: player.score,
    dartsThrown: player.dartsThrown,
  }))
  const lanceur = at(brouillons, index, 'players')

  const closed: Segment[] = []
  let marquesPosees = 0
  let points = 0
  let dartsUsed = 0
  let gagnant: PlayerId | null = null

  for (const dart of darts) {
    // La volée s'arrête sur la fléchette qui gagne : les suivantes ne comptent pas.
    if (gagnant !== null) break

    dartsUsed += 1
    lanceur.dartsThrown += 1

    const cible = targets.indexOf(dart.segment)
    if (cible < 0) continue

    const valeur = targetValue(at(targets, cible, 'targets'))

    // Marque par marque : un triple peut finir de fermer ET marquer avec le surplus.
    for (let restantes = marksOf(dart); restantes > 0; restantes -= 1) {
      const posees = lanceur.marks[cible] ?? 0

      if (posees < MARKS_TO_CLOSE) {
        lanceur.marks[cible] = posees + 1
        marquesPosees += 1
        if (posees + 1 === MARKS_TO_CLOSE) closed.push(at(targets, cible, 'targets'))
        continue
      }

      // Ne rapporte que tant qu'un adversaire ne l'a pas fermée.
      const ouverte = brouillons.filter(
        (autre) =>
          autre.playerId !== lanceur.playerId && (autre.marks[cible] ?? 0) < MARKS_TO_CLOSE,
      )
      if (ouverte.length === 0) continue

      points += valeur
      if (variant === 'CUT_THROAT') {
        for (const victime of ouverte) victime.score += valeur
      } else {
        lanceur.score += valeur
      }
    }

    if (wins(lanceur, brouillons, state.config)) gagnant = lanceur.playerId
  }

  const players: readonly CricketPlayerState[] = brouillons.map((brouillon) => ({
    playerId: brouillon.playerId,
    marks: [...brouillon.marks],
    score: brouillon.score,
    dartsThrown: brouillon.dartsThrown,
  }))

  // ⚠️ Cut-throat : un joueur peut devenir le plus bas pendant le tour d'un autre ; on teste tout le
  // monde en fin de volée, priorité au lanceur.
  const vainqueur =
    gagnant ?? players.find((player) => wins(player, players, state.config))?.playerId ?? null

  const history = [
    ...state.history,
    {
      playerId: lanceur.playerId,
      darts: darts.slice(0, dartsUsed),
      marks: marquesPosees,
      points,
      closed,
    },
  ]

  const milestones: CricketMilestone[] = [...state.milestones]
  for (const target of closed) {
    milestones.push({ type: 'TargetClosed', playerId: lanceur.playerId, target })
  }
  if (vainqueur !== null) milestones.push({ type: 'MatchFinished', winnerId: vainqueur })

  return {
    ...state,
    players,
    currentPlayerIndex: (state.startingPlayerIndex + history.length) % players.length,
    winnerId: vainqueur,
    finished: vainqueur !== null,
    history,
    milestones,
  }
}

/** Rejoue le journal ; l'annulation est `project(events.slice(0, -1))`. */
const project = (events: readonly MatchEvent[]): CricketState => {
  const [first, ...rest] = events
  if (first === undefined || first.type !== 'CricketStarted') {
    throw new DomainError('A Cricket log must start with CricketStarted')
  }

  let state = start(first)
  for (const event of rest) {
    if (event.type !== 'VisitRecorded') {
      throw new DomainError(`A match log holds a single opening event, got ${event.type}`)
    }
    state = applyVisit(state, event.darts)
  }
  return state
}

export const CricketRules = {
  start,
  applyVisit,
  project,
  currentPlayer: (state: CricketState): CricketPlayerState =>
    at(state.players, state.currentPlayerIndex, 'players'),
  isFinished: (state: CricketState): boolean => state.finished,
  closedAll,
  /** Fermée par tous : ne rapporte plus rien. */
  isDead: (state: CricketState, targetIndex: number): boolean =>
    state.players.every((player) => (player.marks[targetIndex] ?? 0) >= MARKS_TO_CLOSE),
}
