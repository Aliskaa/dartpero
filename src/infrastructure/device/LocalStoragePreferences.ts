import {
  createMemoryPreferences,
  type Preferences,
} from '@/core/application/ports/driven/Preferences'

const PREFIXE = 'dartpero:'

/**
 * `localStorage`, avec repli mémoire : en navigation privée sur certains
 * navigateurs, la simple lecture lève une exception.
 */
export const createLocalStoragePreferences = (): Preferences => {
  const disponible = (() => {
    try {
      const sonde = `${PREFIXE}__test`
      localStorage.setItem(sonde, '1')
      localStorage.removeItem(sonde)
      return true
    } catch {
      return false
    }
  })()

  if (!disponible) return createMemoryPreferences()

  return {
    read: <T>(key: string, fallback: T): T => {
      try {
        const brut = localStorage.getItem(PREFIXE + key)
        return brut === null ? fallback : (JSON.parse(brut) as T)
      } catch {
        return fallback
      }
    },
    write: <T>(key: string, value: T): void => {
      try {
        localStorage.setItem(PREFIXE + key, JSON.stringify(value))
      } catch {
        // Quota plein : la préférence est perdue, l'app continue.
      }
    },
  }
}
