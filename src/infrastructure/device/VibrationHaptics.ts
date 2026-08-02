import type { Haptics } from '@/core/application/ports/driven/Haptics'

/** Vibration API. Absente sur iOS : les appels sont simplement sans effet. */
export class VibrationHaptics implements Haptics {
  private vibrer(motif: number | readonly number[]): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    try {
      navigator.vibrate(motif as number | number[])
    } catch {
      // Certains navigateurs refusent hors interaction utilisateur.
    }
  }

  tap(): void {
    this.vibrer(12)
  }

  success(): void {
    this.vibrer([30, 40, 90])
  }

  error(): void {
    this.vibrer([70, 50, 70])
  }
}
