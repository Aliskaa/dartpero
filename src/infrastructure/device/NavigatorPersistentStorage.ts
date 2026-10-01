import type {
  PersistentStorage,
  StorageProtection,
} from '@/core/application/ports/driven/PersistentStorage'

/**
 * `navigator.storage.persist()` / `persisted()`.
 *
 * Trois états, et aucun ne doit casser l'app :
 * - API absente (vieux navigateur, contexte non sécurisé) → `unavailable` ;
 * - refus ou rejet → `not-persisted` : un refus est attendu, pas un défaut
 *   (Chrome tranche selon l'engagement, Safari selon l'installation) ;
 * - accord → `persisted`.
 */
export class NavigatorPersistentStorage implements PersistentStorage {
  /** Le `StorageManager` se passe au constructeur pour tester sans toucher le global. */
  constructor(
    private readonly storage: StorageManager | undefined = typeof navigator === 'undefined'
      ? undefined
      : navigator.storage,
  ) {}

  private get disponible(): boolean {
    return (
      typeof this.storage?.persist === 'function' && typeof this.storage?.persisted === 'function'
    )
  }

  async status(): Promise<StorageProtection> {
    if (!this.storage || !this.disponible) return 'unavailable'
    try {
      return (await this.storage.persisted()) ? 'persisted' : 'not-persisted'
    } catch {
      return 'not-persisted'
    }
  }

  async request(): Promise<StorageProtection> {
    if (!this.storage || !this.disponible) return 'unavailable'
    try {
      return (await this.storage.persist()) ? 'persisted' : 'not-persisted'
    } catch {
      return 'not-persisted'
    }
  }
}
