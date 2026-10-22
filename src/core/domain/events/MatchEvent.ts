import type { CheckoutPracticeConfig } from '../games/checkout-practice/config'
import type { CricketConfig } from '../games/cricket/config'
import type { KillerConfig } from '../games/killer/config'
import type { TourDuMondeConfig } from '../games/tour-du-monde/config'
import type { X01Config } from '../games/x01/config'
import type { Dart, SegmentNumber } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import type { MatchName } from '../value-objects/MatchName'

// Le journal ne contient que des faits bruts (ouverture, fléchettes) : manches, sets et fin
// de partie sont déduits par les règles, ce qui rend l'annulation exacte.
/** ⚠️ Le discriminant reste `'MatchStarted'` : donnée persistée, ne se renomme pas. */
export type X01Started = {
  readonly type: 'MatchStarted'
  readonly config: X01Config
  readonly playerIds: readonly PlayerId[]
  /** Qui commence le premier leg (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/** ⚠️ Événement distinct d'un champ `mode` : les anciens journaux `'MatchStarted'` restent du X01. */
export type TourDuMondeStarted = {
  readonly type: 'TourDuMondeStarted'
  readonly config: TourDuMondeConfig
  readonly playerIds: readonly PlayerId[]
  /** Qui commence la partie (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

export type CricketStarted = {
  readonly type: 'CricketStarted'
  readonly config: CricketConfig
  readonly playerIds: readonly PlayerId[]
  /** Qui commence la partie (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

export type CheckoutPracticeStarted = {
  readonly type: 'CheckoutPracticeStarted'
  readonly config: CheckoutPracticeConfig
  readonly playerIds: readonly PlayerId[]
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/** ⚠️ Les numéros sont tirés puis écrits ici, hors de `config` : `numbers[i]` va à `playerIds[i]`. */
export type KillerStarted = {
  readonly type: 'KillerStarted'
  readonly config: KillerConfig
  readonly playerIds: readonly PlayerId[]
  /** Un numéro de 1 à 20 par joueur, tous différents, dans l'ordre de `playerIds`. */
  readonly numbers: readonly SegmentNumber[]
  /** Qui commence la partie (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/** ⚠️ Le reste tiré au sort est stocké, jamais rejoué : l'annulation ne doit pas changer la cible. */
export type RoundStarted = {
  readonly type: 'RoundStarted'
  readonly target: number
}

export type VisitRecorded = {
  readonly type: 'VisitRecorded'
  /** 1 à 3 fléchettes. Une volée s'arrête plus tôt sur un checkout ou un bust. */
  readonly darts: readonly Dart[]
}

// `VisitRecorded` est partagé par tous les modes ; sans `playerId` : le tour se déduit de la projection.
export type MatchEvent =
  | X01Started
  | TourDuMondeStarted
  | CricketStarted
  | CheckoutPracticeStarted
  | KillerStarted
  | RoundStarted
  | VisitRecorded

/** ⚠️ Sans nom tapé la clé `name` est absente (jamais `undefined`) : on rend `null`. */
export const nameOf = (events: readonly MatchEvent[]): MatchName | null => {
  const [ouverture] = events
  if (ouverture === undefined) return null

  switch (ouverture.type) {
    case 'MatchStarted':
    case 'TourDuMondeStarted':
    case 'CricketStarted':
    case 'CheckoutPracticeStarted':
    case 'KillerStarted':
      return ouverture.name ?? null
    case 'RoundStarted':
    case 'VisitRecorded':
      return null
    default: {
      const impossible: never = ouverture
      return impossible
    }
  }
}

/** Conséquences déduites d'une volée, jamais persistées. */
export type X01Milestone =
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
