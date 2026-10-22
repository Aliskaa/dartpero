import type { ScreenLock } from '@/core/application/ports/driven/ScreenLock'

/** ⚠️ Le navigateur relâche le verrou en arrière-plan : reprise sur `visibilitychange`. Muet si l'API manque. */
export class WakeLockScreenLock implements ScreenLock {
  private sentinel: WakeLockSentinel | null = null
  private voulu = false
  private ecouteInstallee = false

  private get disponible(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator
  }

  private readonly reprendre = () => {
    if (this.voulu && document.visibilityState === 'visible') {
      void this.acquerir()
    }
  }

  private async acquerir(): Promise<void> {
    if (!this.disponible || this.sentinel) return
    try {
      this.sentinel = await navigator.wakeLock.request('screen')
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null
      })
    } catch {
      this.sentinel = null
    }
  }

  async request(): Promise<void> {
    this.voulu = true

    if (!this.ecouteInstallee && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.reprendre)
      this.ecouteInstallee = true
    }

    await this.acquerir()
  }

  async release(): Promise<void> {
    this.voulu = false

    if (this.ecouteInstallee && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.reprendre)
      this.ecouteInstallee = false
    }

    const sentinel = this.sentinel
    this.sentinel = null
    await sentinel?.release().catch(() => {})
  }
}
