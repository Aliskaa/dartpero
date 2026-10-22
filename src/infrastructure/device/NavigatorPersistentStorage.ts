import type {
  PersistentStorage,
  StorageProtection,
} from '@/core/application/ports/driven/PersistentStorage'

/** API absente → `unavailable` ; refus ou rejet → `not-persisted` (un refus est attendu). */
export class NavigatorPersistentStorage implements PersistentStorage {
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
