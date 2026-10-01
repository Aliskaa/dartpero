/**
 * Protection de la base contre l'effacement par le navigateur.
 *
 * Sans elle, Chrome peut vider IndexedDB quand le disque manque, et Safari
 * après environ 7 jours sans ouverture si l'app n'est pas installée. Ce n'est
 * pas une sauvegarde : l'export JSON reste le filet.
 */
export type StorageProtection = 'persisted' | 'not-persisted' | 'unavailable'

export interface PersistentStorage {
  /** L'état actuel. Ne rejette jamais. */
  status(): Promise<StorageProtection>
  /** Demande la protection et renvoie l'état APRÈS la demande. Ne rejette jamais. */
  request(): Promise<StorageProtection>
}

/** API absente : on se comporte en null-object, jamais en erreur. */
export const NullPersistentStorage: PersistentStorage = {
  async status() {
    return 'unavailable'
  },
  async request() {
    return 'unavailable'
  },
}
