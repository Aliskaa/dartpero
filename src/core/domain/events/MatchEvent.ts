import type { X01Config } from '../entities/Match'
import type { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'

/**
 * Le journal d'un match.
 *
 * ⚠️ Décision d'architecture : le journal ne contient QUE des faits bruts —
 * le match a démarré, telles fléchettes ont été lancées. Les legs gagnés, les
 * sets et la fin du match sont **déduits** par les règles (voir `MatchMilestone`),
 * jamais stockés.
 *
 * Pourquoi : c'est ce qui rend l'annulation exacte et sans piège. Annuler,
 * c'est `project(events.slice(0, -1))`. Si le journal contenait aussi les
 * conséquences, il faudrait retirer « la dernière volée ET les événements
 * qu'elle a déclenchés » — précisément la classe de bug qu'on veut éliminer.
 *
 * Corollaire : `VisitRecorded` ne porte pas de `playerId`. À qui est le tour se
 * déduit de la projection, donc le journal ne peut pas être en désaccord avec
 * les règles.
 */
export type MatchStarted = {
  readonly type: 'MatchStarted'
  readonly config: X01Config
  readonly playerIds: readonly PlayerId[]
  /** Qui commence le premier leg (index dans `playerIds`). */
  readonly startingPlayerIndex: number
}

export type VisitRecorded = {
  readonly type: 'VisitRecorded'
  /** 1 à 3 fléchettes. Une volée s'arrête plus tôt sur un checkout ou un bust. */
  readonly darts: readonly Dart[]
}

export type MatchEvent = MatchStarted | VisitRecorded

/**
 * Les conséquences déduites d'une volée. Elles ne sont pas persistées : l'UI
 * s'en sert pour les moments de récompense (leg gagné, match fini) et le lot 5
 * pour l'annonce vocale.
 */
export type MatchMilestone =
  | {
      readonly type: 'LegWon'
      readonly playerId: PlayerId
      readonly legNumber: number
      /** Nombre de fléchettes utilisées par le vainqueur sur ce leg. */
      readonly dartsUsed: number
    }
  | {
      readonly type: 'SetWon'
      readonly playerId: PlayerId
      readonly setNumber: number
    }
  | {
      readonly type: 'MatchFinished'
      readonly winnerId: PlayerId
    }
