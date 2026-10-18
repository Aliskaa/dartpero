import type { CheckoutPracticeConfig } from '../games/checkout-practice/config'
import type { CricketConfig } from '../games/cricket/config'
import type { TourDuMondeConfig } from '../games/tour-du-monde/config'
import type { X01Config } from '../games/x01/config'
import type { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import type { MatchName } from '../value-objects/MatchName'

/**
 * Le journal d'un match.
 *
 * ⚠️ Décision d'architecture : le journal ne contient QUE des faits bruts —
 * le match a démarré, telles fléchettes ont été lancées. Les legs gagnés, les
 * sets et la fin du match sont **déduits** par les règles (voir `X01Milestone`),
 * jamais stockés.
 *
 * Pourquoi : c'est ce qui rend l'annulation exacte et sans piège. Annuler,
 * c'est projeter le journal privé de sa dernière volée — `events.slice(0, -1)`
 * au X01, au Cricket et au Tour du monde ; à l'entraînement, le `RoundStarted`
 * de la manche suivante part avec le `VisitRecorded`, s'il existe (deux
 * événements, pas un) : la dernière volée quitte le journal,
 * et depuis le lot `annulation-volee` ses fléchettes restantes (la dernière
 * en moins) reviennent à la saisie, non persistées comme toute volée en cours
 * — aucun événement nouveau. Si le journal contenait aussi les conséquences,
 * il faudrait retirer « la dernière volée ET les événements qu'elle a
 * déclenchés » — précisément la classe de bug qu'on veut éliminer.
 *
 * Corollaire : `VisitRecorded` ne porte pas de `playerId`. À qui est le tour se
 * déduit de la projection, donc le journal ne peut pas être en désaccord avec
 * les règles.
 */
/**
 * L'ouverture d'une partie de X01.
 *
 * ⚠️ Le type s'appelle `X01Started`, mais son discriminant vaut toujours
 * **`'MatchStarted'`** — et c'est volontaire. Cette chaîne est une **donnée
 * persistée** : elle est écrite dans IndexedDB et dans les sauvegardes JSON
 * déjà exportées par les utilisateurs. La renommer invaliderait toutes les
 * parties enregistrées avant le lot 5a. On corrige donc le nom du **type**, qui
 * mentait (X01 était le seul mode et s'appelait « Match »), sans toucher à un
 * seul octet sur le disque.
 */
export type X01Started = {
  readonly type: 'MatchStarted'
  readonly config: X01Config
  readonly playerIds: readonly PlayerId[]
  /** Qui commence le premier leg (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/**
 * L'ouverture d'une partie de Tour du monde.
 *
 * ⚠️ C'est un **événement distinct**, pas un champ `mode` ajouté à l'ouverture
 * X01 : les journaux déjà en base portent `'MatchStarted'` et doivent continuer
 * à se rejouer en X01 pour toujours, sans migration ni valeur par défaut à
 * deviner. Le mode se lit donc sur le premier événement du journal.
 */
export type TourDuMondeStarted = {
  readonly type: 'TourDuMondeStarted'
  readonly config: TourDuMondeConfig
  readonly playerIds: readonly PlayerId[]
  /** Qui commence la partie (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/** L'ouverture d'une partie de Cricket. La variante (standard ou cut-throat)
 * voyage dans la configuration : elle décide du vainqueur, elle appartient donc
 * au journal et non à un réglage d'affichage. */
export type CricketStarted = {
  readonly type: 'CricketStarted'
  readonly config: CricketConfig
  readonly playerIds: readonly PlayerId[]
  /** Qui commence la partie (index dans `playerIds`). */
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/** L'ouverture d'une session d'entraînement au checkout (solo). */
export type CheckoutPracticeStarted = {
  readonly type: 'CheckoutPracticeStarted'
  readonly config: CheckoutPracticeConfig
  readonly playerIds: readonly PlayerId[]
  readonly startingPlayerIndex: number
  /** Le nom tapé à la création, s'il y en a un (voir `MatchName`). */
  readonly name?: MatchName
}

/**
 * Une manche s'ouvre sur un reste **tiré au sort**.
 *
 * ⚠️ Le tirage est **stocké**, jamais rejoué : l'aléa vient du port
 * `RandomSource` au moment où la manche commence, et le journal n'en garde que
 * le résultat. Rejouer une session ancienne redonne donc exactement la même
 * chose — sans quoi l'annulation changerait les cibles sous les pieds du joueur.
 */
export type RoundStarted = {
  readonly type: 'RoundStarted'
  readonly target: number
}

export type VisitRecorded = {
  readonly type: 'VisitRecorded'
  /** 1 à 3 fléchettes. Une volée s'arrête plus tôt sur un checkout ou un bust. */
  readonly darts: readonly Dart[]
}

/**
 * `VisitRecorded` est **partagé par tous les modes** : une volée, c'est une à
 * trois fléchettes, que l'on décompte un 501 ou que l'on remonte le plateau.
 * Seule l'interprétation change, et elle appartient aux règles du mode.
 */
export type MatchEvent =
  | X01Started
  | TourDuMondeStarted
  | CricketStarted
  | CheckoutPracticeStarted
  | RoundStarted
  | VisitRecorded

/**
 * Le nom tapé d'une partie, lu sur son événement d'ouverture.
 *
 * ⚠️ Le champ `name` des quatre ouvertures est **facultatif** et, sans nom
 * tapé, la clé est **absente** — jamais `name: undefined`, jamais le nom par
 * défaut. Les journaux d'avant le lot `nom-de-partie` n'ont pas la clé et
 * restent valides : ils rendent `null`, et l'UI calcule leur nom à
 * l'affichage depuis la date de création.
 *
 * `switch` exhaustif : un cinquième mode qui oublierait son ouverture ici ne
 * compilerait pas.
 */
export const nameOf = (events: readonly MatchEvent[]): MatchName | null => {
  const [ouverture] = events
  if (ouverture === undefined) return null

  switch (ouverture.type) {
    case 'MatchStarted':
    case 'TourDuMondeStarted':
    case 'CricketStarted':
    case 'CheckoutPracticeStarted':
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

/**
 * Les conséquences déduites d'une volée. Elles ne sont pas persistées : l'UI
 * s'en sert pour les moments de récompense (leg gagné, match fini) et le lot 5
 * pour l'annonce vocale.
 */
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
