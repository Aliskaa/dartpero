// ⚠️ Protège contre l'effacement par le navigateur ; ce n'est pas une sauvegarde (l'export JSON reste le filet).
export type StorageProtection = 'persisted' | 'not-persisted' | 'unavailable'

export interface PersistentStorage {
  /** Ne rejette jamais. */
  status(): Promise<StorageProtection>
  /** Renvoie l'état après la demande. Ne rejette jamais. */
  request(): Promise<StorageProtection>
}

export const NullPersistentStorage: PersistentStorage = {
  async status() {
    return 'unavailable'
  },
  async request() {
    return 'unavailable'
  },
}
