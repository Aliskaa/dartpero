import { DomainError } from '../../DomainError'
import type { KillerStarted, MatchEvent } from '../../events/MatchEvent'
import type { Dart, SegmentNumber } from '../../value-objects/Dart'
import type { PlayerId } from '../../value-objects/ids'
import { KILLER_MAX_PLAYERS, KILLER_MIN_PLAYERS, KILLER_NUMBERS, KillerConfig } from './config'

export type KillerPlayerState = {
  readonly playerId: PlayerId
  /** Son numéro, de 1 à 20, écrit dans `KillerStarted.numbers`. */
  readonly number: SegmentNumber
  readonly lives: number
  /** A touché le double de son numéro : peut frapper les autres. */
  readonly killer: boolean
  /** À 0 vie : sauté au tour de table, son numéro ne vaut plus rien. */
  readonly eliminated: boolean
  readonly dartsThrown: number
}

/**
 * Ce qu'a fait **une** fléchette.
 *
 * - `NONE` : rien (hors 1-20, numéro non attribué ou d'un éliminé, non-killer
 *   sur un adversaire, simple / triple de son numéro avant d'être killer,
 *   son numéro une fois killer sans la variante).
 * - `BECAME_KILLER` : le double de son propre numéro.
 * - `HIT` : des vies retirées à `targetId` — `livesLost` est ce qui a été
 *   **réellement** perdu, plancher à 0 compris (un triple sur 1 vie : 1).
 *   Variante : un tir sur son propre numéro est un `HIT` sur le lanceur.
 */
export type KillerDartEffect =
  | { readonly type: 'NONE' }
  | { readonly type: 'BECAME_KILLER'; readonly playerId: PlayerId }
  | {
      readonly type: 'HIT'
      readonly targetId: PlayerId
      readonly livesLost: number
      readonly eliminated: boolean
    }

export type KillerVisit = {
  readonly playerId: PlayerId
  /** Tronquée à la fléchette qui gagne la partie ou élimine le lanceur. */
  readonly darts: readonly Dart[]
  /** Un effet par fléchette, dans l'ordre de `darts`. */
  readonly effects: readonly KillerDartEffect[]
}

/**
 * Une élimination, dans l'ordre où elle est arrivée. `by` est le lanceur de la
 * fléchette éliminante — le joueur lui-même pour une auto-élimination
 * (variante). Déduite au rejeu : rien n'est stocké.
 */
export type KillerElimination = {
  readonly playerId: PlayerId
  readonly by: PlayerId
}

export type KillerMilestone =
  | { readonly type: 'BecameKiller'; readonly playerId: PlayerId }
  | { readonly type: 'PlayerEliminated'; readonly playerId: PlayerId; readonly by: PlayerId }
  | { readonly type: 'MatchFinished'; readonly winnerId: PlayerId }

export type KillerState = {
  readonly mode: 'KILLER'
  readonly config: KillerConfig
  readonly players: readonly KillerPlayerState[]
  readonly currentPlayerIndex: number
  readonly startingPlayerIndex: number
  readonly winnerId: PlayerId | null
  readonly finished: boolean
  readonly eliminations: readonly KillerElimination[]
  readonly history: readonly KillerVisit[]
  readonly milestones: readonly KillerMilestone[]
}

export type KillerRank = {
  readonly playerId: PlayerId
  readonly rank: number
}

const at = <T>(items: readonly T[], index: number, label: string): T => {
  const item = items[index]
  if (item === undefined) throw new DomainError(`${label}: no entry at index ${index}`)
  return item
}

/** Simple 1, double 2, triple 3 : le barème validé, pour un adversaire comme pour soi. */
const livesOf = (dart: Dart): number =>
  dart.multiplier === 'TRIPLE' ? 3 : dart.multiplier === 'DOUBLE' ? 2 : 1

const start = (event: KillerStarted): KillerState => {
  const { config, playerIds, numbers, startingPlayerIndex } = event

  if (!KillerConfig.isValid(config)) throw new DomainError('Invalid Killer configuration')
  if (playerIds.length < KILLER_MIN_PLAYERS) {
    throw new DomainError(`A Killer match needs at least ${KILLER_MIN_PLAYERS} players`)
  }
  if (playerIds.length > KILLER_MAX_PLAYERS) {
    throw new DomainError(`A Killer match holds at most ${KILLER_MAX_PLAYERS} players`)
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new DomainError('A player cannot appear twice in the same match')
  }
  if (numbers.length !== playerIds.length) {
    throw new DomainError('Each Killer player needs exactly one number')
  }
  for (const numero of numbers) {
    if (!KILLER_NUMBERS.includes(numero)) {
      throw new DomainError(`A Killer number must be an integer from 1 to 20, got ${numero}`)
    }
  }
  if (new Set(numbers).size !== numbers.length) {
    throw new DomainError('Two Killer players cannot share a number')
  }
  if (
    !Number.isInteger(startingPlayerIndex) ||
    startingPlayerIndex < 0 ||
    startingPlayerIndex >= playerIds.length
  ) {
    throw new DomainError(`startingPlayerIndex out of range: ${startingPlayerIndex}`)
  }

  return {
    mode: 'KILLER',
    config,
    players: playerIds.map((playerId, index) => ({
      playerId,
      number: at(numbers, index, 'numbers'),
      lives: config.startingLives,
      killer: false,
      eliminated: false,
      dartsThrown: 0,
    })),
    currentPlayerIndex: startingPlayerIndex,
    startingPlayerIndex,
    winnerId: null,
    finished: false,
    eliminations: [],
    history: [],
    milestones: [],
  }
}

type Brouillon = {
  playerId: PlayerId
  number: SegmentNumber
  lives: number
  killer: boolean
  eliminated: boolean
  dartsThrown: number
}

/**
 * Applique une volée, **fléchette par fléchette**.
 *
 * ⚠️ L'effet de la fléchette k ne dépend que de l'état de départ et des
 * fléchettes 1 à k : l'aperçu pendant la volée, l'enregistrement et le rejeu
 * appellent cette même fonction, et ne peuvent donc pas diverger.
 */
const applyVisit = (state: KillerState, darts: readonly Dart[]): KillerState => {
  if (state.finished) throw new DomainError('Match is already finished')
  if (darts.length < 1 || darts.length > 3) {
    throw new DomainError(`A visit holds 1 to 3 darts, got ${darts.length}`)
  }

  const brouillons: Brouillon[] = state.players.map((player) => ({ ...player }))
  const index = state.currentPlayerIndex
  const lanceur = at(brouillons, index, 'players')
  if (lanceur.eliminated) throw new DomainError('An eliminated player cannot throw')

  const effects: KillerDartEffect[] = []
  const nouveaux: KillerMilestone[] = []
  const eliminations: KillerElimination[] = [...state.eliminations]
  let gagnant: PlayerId | null = null

  const eliminer = (cible: Brouillon): void => {
    cible.eliminated = true
    eliminations.push({ playerId: cible.playerId, by: lanceur.playerId })
    nouveaux.push({ type: 'PlayerEliminated', playerId: cible.playerId, by: lanceur.playerId })
  }

  for (const dart of darts) {
    lanceur.dartsThrown += 1
    const effet = effetDe(dart, lanceur, brouillons, state.config.selfHitCostsLives)
    effects.push(effet)

    if (effet.type === 'BECAME_KILLER') {
      // Le statut change DANS la boucle : la fléchette suivante compte déjà.
      lanceur.killer = true
      nouveaux.push({ type: 'BecameKiller', playerId: lanceur.playerId })
    } else if (effet.type === 'HIT') {
      const cible = brouillons.find((joueur) => joueur.playerId === effet.targetId)
      if (cible === undefined) throw new DomainError('Hit target is not in the match')
      cible.lives -= effet.livesLost
      if (effet.eliminated) eliminer(cible)
    }

    // Une fléchette ne touche qu'un numéro : il reste toujours au moins un vivant.
    const vivants = brouillons.filter((joueur) => !joueur.eliminated)
    if (vivants.length === 1) {
      gagnant = at(vivants, 0, 'alive').playerId
      break
    }
    // Le lanceur éliminé par sa propre fléchette : sa volée s'arrête là.
    if (lanceur.eliminated) break
  }

  const visit: KillerVisit = {
    playerId: lanceur.playerId,
    darts: darts.slice(0, effects.length),
    effects,
  }
  if (gagnant !== null) nouveaux.push({ type: 'MatchFinished', winnerId: gagnant })

  const players: readonly KillerPlayerState[] = brouillons.map((brouillon) => ({ ...brouillon }))

  return {
    ...state,
    players,
    currentPlayerIndex: gagnant !== null ? index : nextAlive(players, index),
    winnerId: gagnant,
    finished: gagnant !== null,
    eliminations,
    history: [...state.history, visit],
    milestones: [...state.milestones, ...nouveaux],
  }
}

/** L'effet d'une fléchette, lu sur l'état en cours de volée. */
const effetDe = (
  dart: Dart,
  lanceur: Brouillon,
  joueurs: readonly Brouillon[],
  selfHitCostsLives: boolean,
): KillerDartEffect => {
  const AUCUN: KillerDartEffect = { type: 'NONE' }
  // `MISS` et la bulle ne sont le numéro de personne.
  if (typeof dart.segment !== 'number') return AUCUN

  const proprietaire = joueurs.find((joueur) => joueur.number === dart.segment)
  // Numéro non attribué, ou numéro d'un éliminé : il ne vaut plus rien.
  if (proprietaire === undefined || proprietaire.eliminated) return AUCUN

  if (proprietaire.playerId === lanceur.playerId) {
    if (!lanceur.killer) {
      // Seul le DOUBLE de son numéro rend killer.
      return dart.multiplier === 'DOUBLE'
        ? { type: 'BECAME_KILLER', playerId: lanceur.playerId }
        : AUCUN
    }
    if (!selfHitCostsLives) return AUCUN
    return toucher(lanceur, dart)
  }

  if (!lanceur.killer) return AUCUN
  return toucher(proprietaire, dart)
}

const toucher = (cible: Brouillon, dart: Dart): KillerDartEffect => {
  // Plancher à 0 : on ne perd que les vies qu'on a.
  const livesLost = Math.min(livesOf(dart), cible.lives)
  return {
    type: 'HIT',
    targetId: cible.playerId,
    livesLost,
    eliminated: cible.lives - livesLost <= 0,
  }
}

/** Le prochain joueur **en vie** après `index`, en tournant. */
const nextAlive = (players: readonly KillerPlayerState[], index: number): number => {
  for (let pas = 1; pas <= players.length; pas += 1) {
    const suivant = (index + pas) % players.length
    if (!at(players, suivant, 'players').eliminated) return suivant
  }
  throw new DomainError('No player left alive')
}

/**
 * Rejoue le journal et renvoie l'état courant.
 *
 * C'est aussi l'implémentation de l'annulation : `project(events.slice(0, -1))`.
 */
const project = (events: readonly MatchEvent[]): KillerState => {
  const [first, ...rest] = events
  if (first === undefined || first.type !== 'KillerStarted') {
    throw new DomainError('A Killer log must start with KillerStarted')
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

/**
 * La volée est-elle close ? Partie finie, trois fléchettes, ou lanceur
 * éliminé par sa propre fléchette. Seule source du « complet » de l'aperçu.
 */
const visitIsOver = (state: KillerState, darts: readonly Dart[]): boolean => {
  if (darts.length === 0) return false
  const apres = applyVisit(state, darts)
  const lanceur = at(apres.players, state.currentPlayerIndex, 'players')
  return apres.finished || darts.length >= 3 || lanceur.eliminated
}

/** Les vies **réellement** perdues par `playerId` pendant cette volée (le « −N »). */
const livesLostIn = (visit: KillerVisit, playerId: PlayerId): number =>
  visit.effects.reduce(
    (total, effet) =>
      effet.type === 'HIT' && effet.targetId === playerId ? total + effet.livesLost : total,
    0,
  )

/**
 * Le classement (règle 9) : le gagnant, puis les vivants par vies
 * décroissantes — l'ordre de jeu départage l'affichage, mais deux vivants à
 * vies égales partagent leur rang tant que la partie dure —, puis les éliminés
 * dans l'ordre **inverse** d'élimination (le dernier éliminé juste derrière).
 * Partie finie : rangs 1 à n, tous distincts.
 */
const ranking = (state: KillerState): readonly KillerRank[] => {
  // L'ordre de jeu = l'ordre de `playerIds`, fixé à l'étape Ordre.
  const ordreDeJeu = (playerId: PlayerId): number =>
    state.players.findIndex((joueur) => joueur.playerId === playerId)

  const vivants = state.players
    .filter((joueur) => !joueur.eliminated)
    .sort((a, b) => {
      if (a.playerId === state.winnerId) return -1
      if (b.playerId === state.winnerId) return 1
      return b.lives - a.lives || ordreDeJeu(a.playerId) - ordreDeJeu(b.playerId)
    })

  const rangsVivants = vivants.map((joueur) => ({
    playerId: joueur.playerId,
    rank: 1 + vivants.filter((autre) => autre.lives > joueur.lives).length,
  }))

  const rangsElimines = [...state.eliminations].reverse().map((elimination, position) => ({
    playerId: elimination.playerId,
    rank: vivants.length + position + 1,
  }))

  return [...rangsVivants, ...rangsElimines]
}

export const KillerRules = {
  start,
  applyVisit,
  project,
  currentPlayer: (state: KillerState): KillerPlayerState =>
    at(state.players, state.currentPlayerIndex, 'players'),
  isFinished: (state: KillerState): boolean => state.finished,
  visitIsOver,
  livesLostIn,
  ranking,
  /** Le nombre de joueurs encore en vie (« N en vie »). */
  aliveCount: (state: KillerState): number =>
    state.players.filter((joueur) => !joueur.eliminated).length,
}
