import { nameOf } from '../../domain/events/MatchEvent'
import { GameModes } from '../../domain/games'
import { MARKS_TO_CLOSE } from '../../domain/games/cricket/config'
import { KillerRules } from '../../domain/games/killer/rules'
import type { PlayerId } from '../../domain/value-objects/ids'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { MatchSummary } from '../ports/driving/MatchSummary'

/** Index pseudo par identifiant, pour éviter une lecture par joueur et par match. */
export const nameIndex = async (
  players: PlayerRepository,
): Promise<ReadonlyMap<PlayerId, string>> => {
  const all = await players.listAll()
  return new Map(all.map((player) => [player.id, player.name]))
}

export type MatchStatus = 'FINISHED' | 'ONGOING' | 'ABANDONED'

/**
 * Le statut d'une partie, **calculé ici et nulle part ailleurs** : l'Accueil
 * comme l'Historique l'appellent, avec le même `ongoingId`.
 *
 * `ongoingId` est l'identifiant de la partie en cours **globale** (celle de
 * `GetOngoingMatch`), jamais filtrée par mode : sous un filtre de mode, la
 * plus récente non terminée *de ce mode* serait faussement « en cours ».
 * Une partie non terminée qui n'est pas celle-là est « abandonnée » (elle
 * reste reprenable). Rien n'est enregistré.
 *
 * ⚠️ `GetOngoingMatch` ne regarde que les 20 parties les plus récentes : si
 * aucune non terminée ne s'y trouve, `ongoingId` vaut `null` et toute non
 * terminée est « abandonnée ».
 */
export const matchStatus = (
  summary: Pick<MatchSummary, 'id' | 'finished'>,
  ongoingId: MatchSummary['id'] | null,
): MatchStatus => {
  if (summary.finished) return 'FINISHED'
  return summary.id === ongoingId ? 'ONGOING' : 'ABANDONED'
}

/**
 * Condense un match en rejouant son journal, quel que soit son mode.
 *
 * Le `name` d'un joueur vaut `null` quand le profil local a été supprimé
 * depuis ; le `name` de la partie vaut `null` quand aucun nom n'a été tapé.
 * Dans les deux cas, c'est à l'UI de choisir le libellé : le cœur ne connaît
 * pas le français.
 */
export const summarize = (
  record: MatchRecord,
  names: ReadonlyMap<PlayerId, string>,
): MatchSummary => {
  const state = GameModes.project(record.events)

  const commun = {
    id: record.id,
    name: nameOf(record.events),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    finished: GameModes.isFinished(state),
    // Un exercice solo n'a pas de vainqueur : on ne bat personne.
    winnerId: state.mode === 'CHECKOUT_PRACTICE' ? null : state.winnerId,
    totalVisits: GameModes.visitCount(state),
  }

  if (state.mode === 'CHECKOUT_PRACTICE') {
    return {
      ...commun,
      mode: 'CHECKOUT_PRACTICE',
      config: state.config,
      players: [{ playerId: state.playerId, name: names.get(state.playerId) ?? null }],
      roundsWon: state.roundsWon,
      roundsPlayed: state.roundsPlayed,
      successPercent: state.successPercent,
    }
  }

  if (state.mode === 'CRICKET') {
    return {
      ...commun,
      mode: 'CRICKET',
      config: state.config,
      targetsTotal: state.config.targets.length,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        closedTargets: player.marks.filter((marks) => marks >= MARKS_TO_CLOSE).length,
        score: player.score,
      })),
    }
  }

  if (state.mode === 'KILLER') {
    // Le rang vient du domaine : une seule implémentation de la règle 9.
    const rangs = new Map(KillerRules.ranking(state).map((r) => [r.playerId, r.rank]))
    return {
      ...commun,
      mode: 'KILLER',
      config: state.config,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        number: player.number,
        lives: player.lives,
        killer: player.killer,
        eliminated: player.eliminated,
        rank: rangs.get(player.playerId) ?? state.players.length,
      })),
    }
  }

  if (state.mode === 'TOUR_DU_MONDE') {
    return {
      ...commun,
      mode: 'TOUR_DU_MONDE',
      config: state.config,
      targetsTotal: state.config.targets.length,
      players: state.players.map((player) => ({
        playerId: player.playerId,
        name: names.get(player.playerId) ?? null,
        targetIndex: player.targetIndex,
        finishedInDarts: player.finishedInDarts,
      })),
    }
  }

  return {
    ...commun,
    mode: 'X01',
    config: state.config,
    legsPlayed: state.milestones.filter((milestone) => milestone.type === 'LegWon').length,
    players: state.players.map((player) => ({
      playerId: player.playerId,
      name: names.get(player.playerId) ?? null,
      remaining: player.remaining,
      legsWonInSet: player.legsWonInSet,
      setsWon: player.setsWon,
    })),
  }
}
