import { DomainError } from '../../DomainError'
import type { MatchEvent, TourDuMondeStarted } from '../../events/MatchEvent'
import type { Dart, Segment } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import type { TourDuMondeConfig } from './config'

export type TourDuMondePlayerState = {
  readonly playerId: PlayerId
  /** Cibles validées ; `config.targets.length` une fois le tour bouclé. */
  readonly targetIndex: number
  readonly dartsThrown: number
  /** Rang de la fléchette qui a bouclé (départage) ; `null` tant qu'il n'a pas fini. */
  readonly finishedInDarts: number | null
}

export type TourDuMondeVisit = {
  readonly playerId: PlayerId
  /** Tronquée à la fléchette qui boucle le tour. */
  readonly darts: readonly Dart[]
  readonly hits: number
  readonly targetIndexBefore: number
  readonly targetIndexAfter: number
}

export type TourDuMondeMilestone =
  | { readonly type: 'TourCompleted'; readonly playerId: PlayerId; readonly darts: number }
  | { readonly type: 'MatchFinished'; readonly winnerId: PlayerId | null }

export type TourDuMondeState = {
  readonly mode: 'TOUR_DU_MONDE'
  readonly config: TourDuMondeConfig
  readonly players: readonly TourDuMondePlayerState[]
  readonly currentPlayerIndex: number
  readonly startingPlayerIndex: number
  /** `null` sur une partie en cours **comme sur un match nul**. */
  readonly winnerId: PlayerId | null
  readonly finished: boolean
  /** Quelqu'un a bouclé mais le tour de table n'est pas fini : les autres jouent leur volée. */
  readonly lastRound: boolean
  readonly history: readonly TourDuMondeVisit[]
  readonly milestones: readonly TourDuMondeMilestone[]
}

const at = <T>(items: readonly T[], index: number, label: string): T => {
  const item = items[index]
  if (item === undefined) throw new DomainError(`${label}: no entry at index ${index}`)
  return item
}

// Toucher = atteindre le secteur, quel que soit l'anneau (la bulle : 25 comme 50).
const touche = (dart: Dart, target: Segment): boolean => dart.segment === target

const start = (event: TourDuMondeStarted): TourDuMondeState => {
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
    mode: 'TOUR_DU_MONDE',
    config,
    players: playerIds.map((playerId) => ({
      playerId,
      targetIndex: 0,
      dartsThrown: 0,
      finishedInDarts: null,
    })),
    currentPlayerIndex: startingPlayerIndex,
    startingPlayerIndex,
    winnerId: null,
    finished: false,
    lastRound: false,
    history: [],
    milestones: [],
  }
}

/** Le moins de fléchettes parmi ceux qui ont bouclé ; ⚠️ égalité parfaite = nul (`null`). */
const departager = (players: readonly TourDuMondePlayerState[]): PlayerId | null => {
  const arrives = players.filter((player) => player.finishedInDarts !== null)
  if (arrives.length === 0) return null

  const meilleur = Math.min(...arrives.map((player) => player.finishedInDarts ?? 0))
  const exaequo = arrives.filter((player) => player.finishedInDarts === meilleur)
  return exaequo.length === 1 ? (exaequo[0]?.playerId ?? null) : null
}

const applyVisit = (state: TourDuMondeState, darts: readonly Dart[]): TourDuMondeState => {
  if (state.finished) throw new DomainError('Match is already finished')
  if (darts.length < 1 || darts.length > 3) {
    throw new DomainError(`A visit holds 1 to 3 darts, got ${darts.length}`)
  }

  const { targets } = state.config
  const index = state.currentPlayerIndex
  const player = at(state.players, index, 'players')

  let cible = player.targetIndex
  let hits = 0
  let dartsUsed = 0

  for (const dart of darts) {
    // Garde-fou : un joueur qui a bouclé n'a plus de cible.
    if (cible >= targets.length) break
    dartsUsed += 1
    if (touche(dart, at(targets, cible, 'targets'))) {
      cible += 1
      hits += 1
      if (cible >= targets.length) break
    }
  }

  const vientDeBoucler = cible >= targets.length && player.finishedInDarts === null
  const joueurApres: TourDuMondePlayerState = {
    ...player,
    targetIndex: cible,
    dartsThrown: player.dartsThrown + dartsUsed,
    finishedInDarts: vientDeBoucler ? player.dartsThrown + dartsUsed : player.finishedInDarts,
  }

  const players = state.players.map((autre, rang) => (rang === index ? joueurApres : autre))
  const history = [
    ...state.history,
    {
      playerId: player.playerId,
      darts: darts.slice(0, dartsUsed),
      hits,
      targetIndexBefore: player.targetIndex,
      targetIndexAfter: cible,
    },
  ]

  // ⚠️ On finit le tour de table : fin seulement quand tout le monde a joué autant de volées.
  const quelquUnABoucle = players.some((autre) => autre.finishedInDarts !== null)
  const tourDeTableComplet = history.length % players.length === 0
  const finished = quelquUnABoucle && tourDeTableComplet
  const winnerId = finished ? departager(players) : null

  const milestones: TourDuMondeMilestone[] = [...state.milestones]
  if (vientDeBoucler) {
    milestones.push({
      type: 'TourCompleted',
      playerId: player.playerId,
      darts: joueurApres.dartsThrown,
    })
  }
  if (finished) milestones.push({ type: 'MatchFinished', winnerId })

  return {
    ...state,
    players,
    currentPlayerIndex: (state.startingPlayerIndex + history.length) % players.length,
    winnerId,
    finished,
    lastRound: quelquUnABoucle && !finished,
    history,
    milestones,
  }
}

/** Rejoue le journal ; l'annulation est `project(events.slice(0, -1))`. */
const project = (events: readonly MatchEvent[]): TourDuMondeState => {
  const [first, ...rest] = events
  if (first === undefined || first.type !== 'TourDuMondeStarted') {
    throw new DomainError('A Tour du monde log must start with TourDuMondeStarted')
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

export const TourDuMondeRules = {
  start,
  applyVisit,
  project,
  currentPlayer: (state: TourDuMondeState): TourDuMondePlayerState =>
    at(state.players, state.currentPlayerIndex, 'players'),
  isFinished: (state: TourDuMondeState): boolean => state.finished,
  currentTarget: (state: TourDuMondeState, player: TourDuMondePlayerState): Segment | null =>
    state.config.targets[player.targetIndex] ?? null,
}
