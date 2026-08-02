/**
 * Empêche l'écran de s'éteindre pendant une partie.
 *
 * Sans ça, l'app est inutilisable en conditions réelles : le téléphone est
 * posé contre un mur et s'éteint entre deux volées. L'API Wake Lock manque sur
 * certains navigateurs — l'adapter doit alors se comporter en null-object,
 * jamais échouer.
 */
export interface ScreenLock {
  request(): Promise<void>
  release(): Promise<void>
}

export const NullScreenLock: ScreenLock = {
  async request() {},
  async release() {},
}
