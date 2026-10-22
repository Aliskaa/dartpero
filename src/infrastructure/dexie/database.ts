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
  /** `MASCULINE` ou `FEMININE`, clé absente si non précisé. Non indexé : pas de `db.version`. */
  gender?: string
}

/** La volée en cours, hors du journal ; `darts` a la forme de `VisitRecorded.darts`. */
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

// Fonction plutôt que sous-classe : `useDefineForClassFields` écraserait les tables installées par Dexie.
export const createDatabase = (name = 'dartpero'): DartperoDatabase => {
  const db = new Dexie(name) as DartperoDatabase

  db.version(1).stores({
    matches: 'id, updatedAt',
    players: 'id, name',
  })

  // v2 : couleur (en tourniquet) et date (« maintenant ») attribuées aux anciens profils,
  // sinon `Player.create` les rejetterait à la lecture.
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

  // v3 : table neuve, sans `upgrade`. ⚠️ `matches` et `players` ne sont pas redéclarées : Dexie garde leur schéma.
  db.version(3).stores({ visitDrafts: 'matchId' })

  return db
}
