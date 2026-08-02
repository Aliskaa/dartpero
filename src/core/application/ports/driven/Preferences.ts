/**
 * Préférences locales de l'appareil (mode de saisie, derniers réglages de
 * partie…). Synchrone : ce sont de petites valeurs lues au rendu.
 *
 * Ce ne sont PAS des données de jeu — celles-ci vivent dans les dépôts.
 */
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
