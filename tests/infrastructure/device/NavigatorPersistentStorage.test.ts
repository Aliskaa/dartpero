import { describe, expect, it } from 'vitest'
import { NavigatorPersistentStorage } from '@/infrastructure/device/NavigatorPersistentStorage'

/** Un vrai objet qui a la forme d'un `StorageManager`, pas un mock : il garde ses compteurs. */
const faux = (
  options: {
    readonly persisted?: () => Promise<boolean>
    readonly persist?: () => Promise<boolean>
  } = {},
) => {
  const appels = { persisted: 0, persist: 0 }
  const gestionnaire = {
    persisted: () => {
      appels.persisted += 1
      return (options.persisted ?? (async () => false))()
    },
    persist: () => {
      appels.persist += 1
      return (options.persist ?? (async () => true))()
    },
  } as unknown as StorageManager
  return { gestionnaire, appels }
}

describe('NavigatorPersistentStorage', () => {
  describe('status()', () => {
    it('renvoie « persisted » quand le navigateur protège déjà la base', async () => {
      const { gestionnaire } = faux({ persisted: async () => true })
      expect(await new NavigatorPersistentStorage(gestionnaire).status()).toBe('persisted')
    })

    it('renvoie « not-persisted » quand elle ne l’est pas', async () => {
      const { gestionnaire } = faux({ persisted: async () => false })
      expect(await new NavigatorPersistentStorage(gestionnaire).status()).toBe('not-persisted')
    })

    it('ne déclenche jamais de demande : lire n’est pas demander', async () => {
      const { gestionnaire, appels } = faux()
      await new NavigatorPersistentStorage(gestionnaire).status()
      expect(appels.persisted).toBe(1)
      expect(appels.persist).toBe(0)
    })

    it('renvoie « not-persisted » si persisted() rejette', async () => {
      const { gestionnaire } = faux({
        persisted: () => Promise.reject(new Error('refusé')),
      })
      expect(await new NavigatorPersistentStorage(gestionnaire).status()).toBe('not-persisted')
    })

    it('renvoie « not-persisted » si persisted() lève de façon synchrone', async () => {
      const gestionnaire = {
        persisted: () => {
          throw new Error('boum')
        },
        persist: async () => true,
      } as unknown as StorageManager
      expect(await new NavigatorPersistentStorage(gestionnaire).status()).toBe('not-persisted')
    })
  })

  describe('request()', () => {
    it('renvoie « persisted » quand la demande est accordée', async () => {
      const { gestionnaire, appels } = faux({ persist: async () => true })
      expect(await new NavigatorPersistentStorage(gestionnaire).request()).toBe('persisted')
      expect(appels.persist).toBe(1)
    })

    it('renvoie « not-persisted » quand la demande est refusée', async () => {
      const { gestionnaire } = faux({ persist: async () => false })
      expect(await new NavigatorPersistentStorage(gestionnaire).request()).toBe('not-persisted')
    })

    it('renvoie « not-persisted » si persist() rejette', async () => {
      const { gestionnaire } = faux({ persist: () => Promise.reject(new Error('refusé')) })
      expect(await new NavigatorPersistentStorage(gestionnaire).request()).toBe('not-persisted')
    })

    it('renvoie « not-persisted » si persist() lève de façon synchrone', async () => {
      const gestionnaire = {
        persisted: async () => false,
        persist: () => {
          throw new Error('boum')
        },
      } as unknown as StorageManager
      expect(await new NavigatorPersistentStorage(gestionnaire).request()).toBe('not-persisted')
    })
  })

  describe('API absente', () => {
    it.each([
      ['pas de StorageManager', undefined],
      ['StorageManager vide', {} as StorageManager],
      [
        'persist() seul, sans persisted()',
        { persist: async () => true } as unknown as StorageManager,
      ],
      [
        'persisted() seul, sans persist()',
        { persisted: async () => true } as unknown as StorageManager,
      ],
    ])('répond « unavailable » partout : %s', async (_, gestionnaire) => {
      const adapter = new NavigatorPersistentStorage(gestionnaire)
      expect(await adapter.status()).toBe('unavailable')
      expect(await adapter.request()).toBe('unavailable')
    })
  })
})
