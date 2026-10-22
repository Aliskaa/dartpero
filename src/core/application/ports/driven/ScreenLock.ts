/** Empêche l'écran de s'éteindre pendant une partie ; l'adapter ne doit jamais échouer. */
export interface ScreenLock {
  request(): Promise<void>
  release(): Promise<void>
}

export const NullScreenLock: ScreenLock = {
  async request() {},
  async release() {},
}
