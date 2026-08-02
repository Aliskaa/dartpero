import type { X01Config } from '@/core/domain/entities/Match'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import { type MatchState, X01Rules } from '@/core/domain/services/x01Rules'
import type { Dart } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'

export const KEVIN = PlayerId.of('kevin')
export const JULIEN = PlayerId.of('julien')

/** Construit le journal d'un match puis le rejoue. */
export const journal = (
  config: X01Config,
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  startingPlayerIndex = 0,
): readonly MatchEvent[] => [
  { type: 'MatchStarted', config, playerIds, startingPlayerIndex },
  ...volees.map((darts): MatchEvent => ({ type: 'VisitRecorded', darts })),
]

export const jouer = (
  config: X01Config,
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  startingPlayerIndex = 0,
): MatchState => X01Rules.project(journal(config, playerIds, volees, startingPlayerIndex))

/** Le joueur dont c'est le tour. */
export const courant = (state: MatchState) => X01Rules.currentPlayer(state)

/** L'état d'un joueur, par identifiant. */
export const joueur = (state: MatchState, playerId: PlayerId) => {
  const found = state.players.find((p) => p.playerId === playerId)
  if (!found) throw new Error(`Joueur introuvable : ${playerId}`)
  return found
}

export const derniereVolee = (state: MatchState) => {
  const visit = state.history.at(-1)
  if (!visit) throw new Error('Aucune volée dans l’historique')
  return visit
}
