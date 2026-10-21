import type { KillerStarted, MatchEvent } from '@/core/domain/events/MatchEvent'
import { KillerConfig, type KillerConfigInput } from '@/core/domain/games/killer/config'
import {
  type KillerPlayerState,
  KillerRules,
  type KillerState,
} from '@/core/domain/games/killer/rules'
import type { Dart, SegmentNumber } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'

export const KEVIN = PlayerId.of('kevin')
export const JULIEN = PlayerId.of('julien')
export const SARAH = PlayerId.of('sarah')
export const PAUL = PlayerId.of('paul')
export const LEA = PlayerId.of('lea')
export const MARC = PlayerId.of('marc')

/** L'ouverture d'une partie de Killer. Kevin a le 8, Julien le 14, Sarah le 3… */
export const ouverture = (
  options: {
    readonly config?: KillerConfigInput
    readonly playerIds?: readonly PlayerId[]
    readonly numbers?: readonly SegmentNumber[]
    readonly startingPlayerIndex?: number
  } = {},
): KillerStarted => {
  const playerIds = options.playerIds ?? [KEVIN, JULIEN]
  return {
    type: 'KillerStarted',
    config: KillerConfig.create(options.config),
    playerIds,
    numbers: options.numbers ?? ([8, 14, 3, 11, 17, 20] as const).slice(0, playerIds.length),
    startingPlayerIndex: options.startingPlayerIndex ?? 0,
  }
}

export const journal = (
  start: KillerStarted,
  volees: readonly (readonly Dart[])[],
): readonly MatchEvent[] => [
  start,
  ...volees.map((darts): MatchEvent => ({ type: 'VisitRecorded', darts })),
]

export const jouer = (start: KillerStarted, volees: readonly (readonly Dart[])[]): KillerState =>
  KillerRules.project(journal(start, volees))

export const joueur = (state: KillerState, playerId: PlayerId): KillerPlayerState => {
  const trouve = state.players.find((p) => p.playerId === playerId)
  if (!trouve) throw new Error(`Joueur introuvable : ${playerId}`)
  return trouve
}

export const derniereVolee = (state: KillerState) => {
  const visit = state.history.at(-1)
  if (!visit) throw new Error('Aucune volée dans l’historique')
  return visit
}
