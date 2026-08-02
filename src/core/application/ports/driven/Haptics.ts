/** Retour tactile à la saisie. Muet si le matériel ne suit pas. */
export interface Haptics {
  tap(): void
  success(): void
  error(): void
}

export const NullHaptics: Haptics = {
  tap() {},
  success() {},
  error() {},
}
