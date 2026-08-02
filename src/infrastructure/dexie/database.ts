import Dexie, { type EntityTable } from 'dexie'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'

export type StoredMatch = {
  id: string
  createdAt: number
  updatedAt: number
  events: MatchEvent[]
}

export type StoredPlayer = {
  id: string
  name: string
}

export type DartperoDatabase = Dexie & {
  matches: EntityTable<StoredMatch, 'id'>
  players: EntityTable<StoredPlayer, 'id'>
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

  return db
}
