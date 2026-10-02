import type {
  AppInstallation,
  InstallOutcome,
  InstallState,
} from '@/core/application/ports/driven/AppInstallation'

/**
 * La part de `window` que lit l'adapter. Se passe au constructeur pour tester
 * sans toucher le global — un vrai `EventTarget`, pas un mock.
 */
export type InstallWindow = EventTarget & {
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'> & EventTarget
  readonly navigator: {
    readonly userAgent: string
    readonly maxTouchPoints?: number
    /** Safari iOS seulement : vrai quand l'app est ouverte depuis l'écran d'accueil. Absent de lib.dom. */
    readonly standalone?: boolean
  }
}

/** L'événement `beforeinstallprompt` de Chromium, non standard, absent de lib.dom. */
type InstallPromptEvent = Event & {
  prompt(): Promise<unknown>
  readonly userChoice: Promise<{ readonly outcome?: string } | undefined>
}

/** Navigateurs iOS qui se présentent avec les jetons de Safari, mais n'en sont pas. */
const NAVIGATEURS_TIERS =
  /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|FBAN|FBAV|Instagram|Line\//

/**
 * Le navigateur iOS, d'après l'user agent : `null` hors iOS.
 *
 * - iOS : `iPhone`, `iPad`, `iPod`, ou `Macintosh` **tactile** — un iPad en
 *   « site pour ordinateur » se présente comme un Mac, mais un Mac a 0 point
 *   de contact.
 * - Safari : `Version/` et `Safari/`, sans jeton d'un navigateur tiers. Les
 *   navigateurs intégrés aux apps n'ont pas `Version/` : « Ouvrez dans
 *   Safari » est alors le bon conseil.
 *
 * Limites assumées : Brave iOS se présente comme Safari ; un futur Mac
 * tactile passerait pour un iPad. Le repli reste lisible.
 */
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

/**
 * `beforeinstallprompt`, `appinstalled`, `(display-mode: standalone)` et
 * `navigator.standalone` — le seul endroit de `src/` qui les lit.
 *
 * Les écouteurs sont posés **dans le constructeur** : l'invite de Chromium
 * peut partir avant le montage de React. D'où une instance unique par page,
 * créée dans `src/main.tsx` avant `createRoot`.
 *
 * Rien ne doit casser : `window` absent, API manquante ou qui lève →
 * `unavailable`, abonnement muet, `prompt()` → `'unavailable'`.
 */
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
        // C'est l'app qui propose l'installation — ou qui se tait après
        // « Plus tard ». Sans ça, Chrome afficherait sa propre bannière.
        evenement.preventDefault()
        this.invite = evenement
        this.publier()
      })

      win.addEventListener('appinstalled', () => {
        if (this.hs) return
        // En mémoire seulement : persisté, une désinstallation le rendrait
        // faux pour toujours.
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

    // Une invite ne sert qu'une fois : retirée et publiée AVANT toute attente,
    // pour qu'un second appel concurrent n'y retouche pas.
    this.invite = undefined
    this.publier()

    let ouverture: Promise<unknown>
    try {
      // Appelée sans `await` préalable : l'activation utilisateur du clic doit
      // encore être là.
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

  /** Recalcule l'état, PUIS prévient les abonnés. Un abonné qui lève ne prive pas les autres. */
  private publier(): void {
    this.etat = this.calculer()
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {
        // Un abonné défaillant ne casse ni l'adapter ni les autres abonnés.
      }
    }
  }
}
