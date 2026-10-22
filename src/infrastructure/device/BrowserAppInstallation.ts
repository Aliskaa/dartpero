import type {
  AppInstallation,
  InstallOutcome,
  InstallState,
} from '@/core/application/ports/driven/AppInstallation'

/** La part de `window` que lit l'adapter, injectable pour les tests. */
export type InstallWindow = EventTarget & {
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'> & EventTarget
  readonly navigator: {
    readonly userAgent: string
    readonly maxTouchPoints?: number
    /** Safari iOS seulement, absent de lib.dom. */
    readonly standalone?: boolean
  }
}

type InstallPromptEvent = Event & {
  prompt(): Promise<unknown>
  readonly userChoice: Promise<{ readonly outcome?: string } | undefined>
}

/** Navigateurs iOS qui se présentent avec les jetons de Safari, mais n'en sont pas. */
const NAVIGATEURS_TIERS =
  /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|FBAN|FBAV|Instagram|Line\//

/** Navigateur iOS d'après l'user agent (`null` hors iOS) ; un iPad « site ordinateur » se présente comme un Mac tactile. */
export const detectIosBrowser = (
  userAgent: string,
  maxTouchPoints = 0,
): 'safari' | 'other' | null => {
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
  if (!ios) return null
  const safari =
    /Version\//.test(userAgent) && /Safari\//.test(userAgent) && !NAVIGATEURS_TIERS.test(userAgent)
  return safari ? 'safari' : 'other'
}

const estInvite = (evenement: Event): evenement is InstallPromptEvent =>
  typeof (evenement as Partial<InstallPromptEvent>).prompt === 'function'

/** ⚠️ Écouteurs posés dans le constructeur : l'invite peut partir avant le montage de React. Jamais d'exception. */
export class BrowserAppInstallation implements AppInstallation {
  private etat: InstallState = 'unavailable'
  private hs = false
  private invite: InstallPromptEvent | undefined
  private installee = false
  private fenetreAutonome = false
  private standaloneIos = false
  private ios: 'safari' | 'other' | null = null
  private readonly abonnes = new Set<() => void>()

  constructor(win: InstallWindow | undefined = typeof window === 'undefined' ? undefined : window) {
    try {
      if (!win) {
        this.hs = true
        return
      }
      const { navigator } = win
      this.ios = detectIosBrowser(navigator.userAgent, navigator.maxTouchPoints ?? 0)
      this.standaloneIos = navigator.standalone === true

      const requete =
        typeof win.matchMedia === 'function' ? win.matchMedia('(display-mode: standalone)') : null
      if (requete) {
        this.fenetreAutonome = requete.matches === true
        requete.addEventListener('change', () => {
          this.fenetreAutonome = requete.matches === true
          this.publier()
        })
      }

      win.addEventListener('beforeinstallprompt', (evenement) => {
        if (this.hs || !estInvite(evenement)) return
        // Sans preventDefault, Chrome afficherait sa propre bannière.
        evenement.preventDefault()
        this.invite = evenement
        this.publier()
      })

      win.addEventListener('appinstalled', () => {
        if (this.hs) return
        // En mémoire seulement : persisté, une désinstallation le rendrait faux.
        this.installee = true
        this.invite = undefined
        this.publier()
      })

      this.etat = this.calculer()
    } catch {
      this.hs = true
      this.invite = undefined
      this.etat = 'unavailable'
    }
  }

  state(): InstallState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    if (this.hs) return () => {}
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  prompt(): Promise<InstallOutcome> {
    const invite = this.invite
    if (this.hs || !invite) return Promise.resolve('unavailable')

    // Une invite ne sert qu'une fois : retirée AVANT toute attente (appel concurrent).
    this.invite = undefined
    this.publier()

    let ouverture: Promise<unknown>
    try {
      // Sans `await` préalable : l'activation utilisateur du clic doit rester valide.
      ouverture = invite.prompt()
    } catch {
      return Promise.resolve('unavailable')
    }

    return (async (): Promise<InstallOutcome> => {
      try {
        await ouverture
        const choix = await invite.userChoice
        if (choix?.outcome === 'accepted') return 'accepted'
        if (choix?.outcome === 'dismissed') return 'dismissed'
        return 'unavailable'
      } catch {
        return 'unavailable'
      }
    })()
  }

  /** Installée > invite tenue > Safari iOS > autre navigateur iOS > indisponible. */
  private calculer(): InstallState {
    if (this.installee || this.fenetreAutonome || this.standaloneIos) return 'installed'
    if (this.invite) return 'installable'
    if (this.ios === 'safari') return 'ios-manual'
    if (this.ios === 'other') return 'ios-other-browser'
    return 'unavailable'
  }

  private publier(): void {
    this.etat = this.calculer()
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {}
    }
  }
}
