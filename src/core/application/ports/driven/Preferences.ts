/** Préférences d'appareil, synchrones ; pas des données de jeu. */
export interface Preferences {
  read<T>(key: string, fallback: T): T
  write<T>(key: string, value: T): void
}

export const createMemoryPreferences = (): Preferences => {
  const valeurs = new Map<string, unknown>()
  return {
    read: <T>(key: string, fallback: T): T =>
      valeurs.has(key) ? (valeurs.get(key) as T) : fallback,
    write: <T>(key: string, value: T) => {
      valeurs.set(key, value)
    },
  }
}
