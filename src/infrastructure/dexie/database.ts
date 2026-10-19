import Dexie, { type EntityTable } from 'dexie'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import type { Dart } from '@/core/domain/value-objects/Dart'
import { PLAYER_COLORS } from '@/core/domain/value-objects/PlayerColor'

export type StoredMatch = {
  id: string
  createdAt: number
  updatedAt: number
  events: MatchEvent[]
}

export type StoredPlayer = {
  id: string
  name: string
  color: string
  createdAt: number
}

/**
 * La volée en cours d'une partie (lot `volee-partielle`), hors du journal.
 * `darts` a la forme de `VisitRecorded.darts`. Aucun horodatage : rien à
 * expirer, rien de plus à garder que ce qui se rend à l'écran.
 */
export type StoredVisitDraft = {
  matchId: string
  visitCount: number
  darts: Dart[]
}

export type DartperoDatabase = Dexie & {
  matches: EntityTable<StoredMatch, 'id'>
  players: EntityTable<StoredPlayer, 'id'>
  visitDrafts: EntityTable<StoredVisitDraft, 'matchId'>
}

/**
 * Base locale (IndexedDB). On passe par une fonction plutôt qu'une sous-classe :
 * avec `useDefineForClassFields`, les champs de classe écraseraient les tables
 * que Dexie installe sur l'instance.
 */
export const createDatabase = (name = 'dartpero'): DartperoDatabase => {
  const db = new Dexie(name) as DartperoDatabase

  db.version(1).stores({
    matches: 'id, updatedAt',
    players: 'id, name',
  })

  /**
   * v2 — les profils gagnent une couleur et une date de création (lot 4).
   *
   * Les joueurs déjà en base n'en ont pas : on leur en attribue une plutôt que
   * de les laisser invalides, sinon `Player.create` les rejetterait à la
   * lecture et l'utilisateur perdrait ses profils en mettant l'app à jour. La
   * couleur est distribuée en tourniquet sur l'ordre de lecture, et la date de
   * création retombe sur « maintenant » — c'est faux, mais c'est monotone et ça
   * ne sert qu'à trier.
   *
   * Le schéma des tables ne change pas : seules les données sont complétées.
   */
  db.version(2).upgrade(async (transaction) => {
    const maintenant = Date.now()
    let rang = 0

    await transaction
      .table<StoredPlayer>('players')
      .toCollection()
      .modify((joueur) => {
        if (!joueur.color) {
          joueur.color = PLAYER_COLORS[rang % PLAYER_COLORS.length] as string
          rang += 1
        }
        if (!joueur.createdAt) joueur.createdAt = maintenant
      })
  })

  /**
   * v3 — le brouillon de volée (lot `volee-partielle`) : une table de plus,
   * une ligne par partie, clé `matchId`, sans index.
   *
   * **Sans `upgrade`** : la table naît vide et rien d'existant n'est transformé.
   * `matches` et `players` ne sont pas redéclarées : Dexie garde le schéma
   * d'une table que la nouvelle version ne mentionne pas (prouvé par le test de
   * migration v2 → v3). Les redéclarer à l'identique ne changerait rien ; les
   * redéclarer **autrement** toucherait aux index des parties.
   */
  db.version(3).stores({ visitDrafts: 'matchId' })

  return db
}
