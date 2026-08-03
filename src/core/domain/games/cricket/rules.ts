import { DomainError } from '../../DomainError'
import type { CricketStarted, MatchEvent } from '../../events/MatchEvent'
import type { Dart, Segment } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import { type CricketConfig, MARKS_TO_CLOSE, targetValue } from './config'

export type CricketPlayerState = {
  readonly playerId: PlayerId
  /** Marques par cible, dans l'ordre de `config.targets`. Une cible est fermée à 3. */
  readonly marks: readonly number[]
  readonly score: number
  readonly dartsThrown: number
}

export type CricketVisit = {
  readonly playerId: PlayerId
  /** Tronquée à la fléchette qui gagne la partie, comme une volée de checkout. */
  readonly darts: readonly Dart[]
  /** Marques posées sur des cibles encore ouvertes (celles qui font avancer). */
  readonly marks: number
  /**
   * Les points produits par la volée. ⚠️ En cut-throat ils ne vont **pas** au
   * lanceur mais à ses adversaires : c'est le même nombre, distribué à
   * l'envers. L'UI a besoin de le montrer dans les deux cas.
   */
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

/**
 * Une fléchette pose autant de marques que son multiplicateur : un triple 20
 * ferme le 20 d'un coup. Le bullseye compte pour deux marques — c'est un
 * double, et le triple bull n'existe pas (`Dart.of` le refuse déjà).
 */
const marksOf = (dart: Dart): number =>
  dart.multiplier === 'TRIPLE' ? 3 : dart.multiplier === 'DOUBLE' ? 2 : 1

const closedAll = (player: CricketPlayerState): boolean =>
  player.marks.every((marks) => marks >= MARKS_TO_CLOSE)

/**
 * A-t-on gagné ? Il faut avoir **tout fermé** et être devant — ou derrière en
 * cut-throat, où le plus petit score l'emporte.
 *
 * ⚠️ L'égalité au score suffit (`>=`, `<=`) : celui qui a fermé toutes les
 * cibles le premier n'a pas à creuser un écart artificiel pour conclure.
 */
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

/** Copie de travail : une volée touche potentiellement tous les joueurs (en
 * cut-throat, marquer alimente le score des autres). */
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

    // Marque par marque, parce qu'un triple peut à la fois finir de fermer une
    // cible ET marquer des points avec ce qui dépasse.
    for (let restantes = marksOf(dart); restantes > 0; restantes -= 1) {
      const posees = lanceur.marks[cible] ?? 0

      if (posees < MARKS_TO_CLOSE) {
        lanceur.marks[cible] = posees + 1
        marquesPosees += 1
        if (posees + 1 === MARKS_TO_CLOSE) closed.push(at(targets, cible, 'targets'))
        continue
      }

      // Cible fermée chez le lanceur : elle rapporte tant qu'un adversaire ne
      // l'a pas fermée à son tour. Fermée par tout le monde, elle est morte.
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

  /**
   * ⚠️ Le cas tordu du cut-throat : un joueur qui a tout fermé ne reçoit plus
   * jamais de points, alors que ceux des autres montent. Il peut donc devenir
   * le plus bas **pendant le tour de quelqu'un d'autre**. On vérifie donc la
   * condition de victoire pour tout le monde à la fin de la volée, en donnant
   * la priorité au lanceur — sinon la partie continuerait alors qu'elle est
   * gagnée, et personne ne comprendrait pourquoi.
   */
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

/**
 * Rejoue le journal et renvoie l'état courant.
 *
 * C'est aussi l'implémentation de l'annulation : `project(events.slice(0, -1))`.
 */
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
  /** Une cible fermée par **tous** les joueurs ne rapporte plus rien : morte. */
  isDead: (state: CricketState, targetIndex: number): boolean =>
    state.players.every((player) => (player.marks[targetIndex] ?? 0) >= MARKS_TO_CLOSE),
}
