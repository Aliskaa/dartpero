import { describe, expect, it } from 'vitest'
import {
  BrowserAppInstallation,
  detectIosBrowser,
  type InstallWindow,
} from '@/infrastructure/device/BrowserAppInstallation'

/** User agents réels (ou fidèles à leur forme réelle). */
const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipadSafari:
    'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  /** iPadOS en « site pour ordinateur » : il se présente comme un Mac. */
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  criOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  fxiOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  edgiOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.56 Mobile/15E148 Safari/605.1.15',
  /** Navigateur intégré d'une app (Instagram, Facebook…) : pas de `Version/`. */
  integre:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 337.0.3.23.54',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
} as const

/** Une requête média réelle (`EventTarget`), dont le test bascule `matches`. */
class FausseRequete extends EventTarget {
  constructor(public matches: boolean) {
    super()
  }

  basculer(matches: boolean): void {
    this.matches = matches
    this.dispatchEvent(new Event('change'))
  }
}

/** L'invite de Chromium : un vrai `Event` annulable, qui compte ses ouvertures. */
class FausseInvite extends Event {
  promptCalls = 0

  constructor(
    private readonly options: {
      readonly issue?: 'accepted' | 'dismissed'
      readonly promptRejette?: boolean
      readonly promptLeve?: boolean
      readonly choixRejette?: boolean
    } = {},
  ) {
    super('beforeinstallprompt', { cancelable: true })
  }

  prompt(): Promise<void> {
    this.promptCalls += 1
    if (this.options.promptLeve) throw new Error('prompt indisponible')
    if (this.options.promptRejette) return Promise.reject(new Error('déjà affichée'))
    return Promise.resolve()
  }

  get userChoice(): Promise<{ outcome: string }> {
    if (this.options.choixRejette) return Promise.reject(new Error('fermée'))
    return Promise.resolve({ outcome: this.options.issue ?? 'accepted' })
  }
}

const fenetre = (
  options: {
    readonly userAgent?: string
    readonly maxTouchPoints?: number
    readonly standalone?: boolean
    readonly autonome?: boolean
    readonly sansMatchMedia?: boolean
  } = {},
) => {
  const requete = new FausseRequete(options.autonome ?? false)
  const requetes: string[] = []
  const win: InstallWindow = Object.assign(new EventTarget(), {
    matchMedia: options.sansMatchMedia
      ? undefined
      : (query: string) => {
          requetes.push(query)
          return requete
        },
    navigator: {
      userAgent: options.userAgent ?? UA.chromeAndroid,
      maxTouchPoints: options.maxTouchPoints ?? 0,
      ...(options.standalone === undefined ? {} : { standalone: options.standalone }),
    },
  })
  return { win, requete, requetes }
}

describe('detectIosBrowser', () => {
  it.each([
    ['Safari iPhone', UA.iphoneSafari, 5, 'safari'],
    ['Safari iPad', UA.ipadSafari, 5, 'safari'],
    ['iPad en « site pour ordinateur » (Mac tactile)', UA.macSafari, 5, 'safari'],
    ['Chrome iOS', UA.criOS, 5, 'other'],
    ['Firefox iOS', UA.fxiOS, 5, 'other'],
    ['Edge iOS, malgré son « Version/ »', UA.edgiOS, 5, 'other'],
    ['navigateur intégré à une app', UA.integre, 5, 'other'],
  ] as const)('%s → %s', (_nom, userAgent, points, attendu) => {
    expect(detectIosBrowser(userAgent, points)).toBe(attendu)
  })

  it('un vrai Mac (0 point de contact) n’est pas un iPad', () => {
    expect(detectIosBrowser(UA.macSafari, 0)).toBeNull()
    expect(detectIosBrowser(UA.macSafari)).toBeNull()
  })

  it('Chrome Android n’est pas iOS', () => {
    expect(detectIosBrowser(UA.chromeAndroid, 5)).toBeNull()
  })
})

describe('BrowserAppInstallation', () => {
  describe('invite native', () => {
    it('capte l’invite : état « installable », défaut empêché, abonné prévenu', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      let appels = 0
      installation.subscribe(() => {
        appels += 1
      })
      expect(installation.state()).toBe('unavailable')

      const invite = new FausseInvite()
      win.dispatchEvent(invite)

      expect(installation.state()).toBe('installable')
      expect(invite.defaultPrevented).toBe(true)
      expect(appels).toBe(1)
    })

    it('n’ouvre jamais l’invite de lui-même', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      const invite = new FausseInvite()
      win.dispatchEvent(invite)

      expect(installation.state()).toBe('installable')
      expect(invite.promptCalls).toBe(0)
    })

    it('ignore un événement qui n’a pas la forme d’une invite', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      const leurre = new Event('beforeinstallprompt', { cancelable: true })
      win.dispatchEvent(leurre)

      expect(installation.state()).toBe('unavailable')
      expect(leurre.defaultPrevented).toBe(false)
    })

    it('garde la dernière invite reçue', async () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      const premiere = new FausseInvite()
      const derniere = new FausseInvite()
      win.dispatchEvent(premiere)
      win.dispatchEvent(derniere)

      await installation.prompt()
      expect(premiere.promptCalls).toBe(0)
      expect(derniere.promptCalls).toBe(1)
    })

    it('prompt() ouvre l’invite une fois ; un second appel ne la rouvre pas', async () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      const invite = new FausseInvite({ issue: 'accepted' })
      win.dispatchEvent(invite)

      const [premier, second] = await Promise.all([installation.prompt(), installation.prompt()])

      expect(premier).toBe('accepted')
      expect(second).toBe('unavailable')
      expect(invite.promptCalls).toBe(1)
      expect(await installation.prompt()).toBe('unavailable')
      expect(invite.promptCalls).toBe(1)
    })

    it('retire l’invite et publie AVANT toute attente', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite())
      const vus: string[] = []
      installation.subscribe(() => vus.push(installation.state()))

      void installation.prompt()

      // Synchrone : rien n'a encore été attendu.
      expect(installation.state()).toBe('unavailable')
      expect(vus).toEqual(['unavailable'])
    })

    it('rend « dismissed » quand l’utilisateur refuse', async () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite({ issue: 'dismissed' }))

      expect(await installation.prompt()).toBe('dismissed')
    })

    it('« accepted » ne vaut pas installation : seul appinstalled le dit', async () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite({ issue: 'accepted' }))

      expect(await installation.prompt()).toBe('accepted')
      expect(installation.state()).toBe('unavailable')
    })

    it('sans invite, prompt() rend « unavailable » sans rien appeler', async () => {
      const { win } = fenetre()
      expect(await new BrowserAppInstallation(win).prompt()).toBe('unavailable')
    })

    it.each([
      ['prompt() qui rejette', { promptRejette: true }],
      ['prompt() qui lève', { promptLeve: true }],
      ['userChoice qui rejette', { choixRejette: true }],
    ] as const)('%s → « unavailable », sans exception', async (_nom, options) => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite(options))

      await expect(installation.prompt()).resolves.toBe('unavailable')
    })
  })

  describe('installée', () => {
    it('appinstalled → « installed », l’invite est oubliée', async () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      const invite = new FausseInvite()
      win.dispatchEvent(invite)
      let appels = 0
      installation.subscribe(() => {
        appels += 1
      })

      win.dispatchEvent(new Event('appinstalled'))

      expect(installation.state()).toBe('installed')
      expect(appels).toBe(1)
      expect(await installation.prompt()).toBe('unavailable')
      expect(invite.promptCalls).toBe(0)
    })

    it('lancée en fenêtre autonome → « installed » dès la construction', () => {
      const { win, requetes } = fenetre({ autonome: true })
      expect(new BrowserAppInstallation(win).state()).toBe('installed')
      expect(requetes).toEqual(['(display-mode: standalone)'])
    })

    it('suit la bascule de la requête display-mode', () => {
      const { win, requete } = fenetre()
      const installation = new BrowserAppInstallation(win)
      let appels = 0
      installation.subscribe(() => {
        appels += 1
      })

      requete.basculer(true)
      expect(installation.state()).toBe('installed')
      requete.basculer(false)
      expect(installation.state()).toBe('unavailable')
      expect(appels).toBe(2)
    })

    it('navigator.standalone (Safari iOS) → « installed »', () => {
      const { win } = fenetre({ userAgent: UA.iphoneSafari, maxTouchPoints: 5, standalone: true })
      expect(new BrowserAppInstallation(win).state()).toBe('installed')
    })
  })

  describe('iOS', () => {
    it('Safari iPhone → « ios-manual »', () => {
      const { win } = fenetre({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 })
      expect(new BrowserAppInstallation(win).state()).toBe('ios-manual')
    })

    it('iPad en Mac tactile → « ios-manual »', () => {
      const { win } = fenetre({ userAgent: UA.macSafari, maxTouchPoints: 5 })
      expect(new BrowserAppInstallation(win).state()).toBe('ios-manual')
    })

    it('Chrome iOS → « ios-other-browser »', () => {
      const { win } = fenetre({ userAgent: UA.criOS, maxTouchPoints: 5 })
      expect(new BrowserAppInstallation(win).state()).toBe('ios-other-browser')
    })

    it('Firefox iOS → « ios-other-browser »', () => {
      const { win } = fenetre({ userAgent: UA.fxiOS, maxTouchPoints: 5 })
      expect(new BrowserAppInstallation(win).state()).toBe('ios-other-browser')
    })

    it('un vrai Mac Safari → « unavailable »', () => {
      const { win } = fenetre({ userAgent: UA.macSafari, maxTouchPoints: 0 })
      expect(new BrowserAppInstallation(win).state()).toBe('unavailable')
    })
  })

  describe('priorités', () => {
    it('installée l’emporte sur une invite tenue', () => {
      const { win, requete } = fenetre()
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite())
      requete.basculer(true)
      expect(installation.state()).toBe('installed')
    })

    it('une invite tenue l’emporte sur l’iOS (cas théorique)', () => {
      const { win } = fenetre({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 })
      const installation = new BrowserAppInstallation(win)
      win.dispatchEvent(new FausseInvite())
      expect(installation.state()).toBe('installable')
    })

    it('installée l’emporte sur Safari iOS', () => {
      const { win } = fenetre({ userAgent: UA.iphoneSafari, maxTouchPoints: 5, autonome: true })
      expect(new BrowserAppInstallation(win).state()).toBe('installed')
    })
  })

  describe('rien ne casse', () => {
    it('sans window : « unavailable », abonnement muet, prompt() « unavailable »', async () => {
      const installation = new BrowserAppInstallation(undefined)
      const desabonner = installation.subscribe(() => {
        throw new Error('ne doit jamais être appelé')
      })
      expect(installation.state()).toBe('unavailable')
      expect(await installation.prompt()).toBe('unavailable')
      expect(() => desabonner()).not.toThrow()
    })

    it('matchMedia absent : la détection continue sans lui', () => {
      const { win } = fenetre({
        sansMatchMedia: true,
        userAgent: UA.iphoneSafari,
        maxTouchPoints: 5,
      })
      expect(new BrowserAppInstallation(win).state()).toBe('ios-manual')
    })

    it('addEventListener qui lève : « unavailable », jamais d’exception', async () => {
      const { win } = fenetre({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 })
      win.addEventListener = () => {
        throw new Error('refusé')
      }
      let installation: BrowserAppInstallation | undefined
      expect(() => {
        installation = new BrowserAppInstallation(win)
      }).not.toThrow()
      expect(installation?.state()).toBe('unavailable')
      expect(await installation?.prompt()).toBe('unavailable')
    })

    it('matchMedia qui lève : « unavailable », jamais d’exception', () => {
      const { win } = fenetre()
      const piege: InstallWindow = Object.assign(win, {
        matchMedia: () => {
          throw new Error('refusé')
        },
      })
      expect(new BrowserAppInstallation(piege).state()).toBe('unavailable')
    })

    it('un abonné qui lève ne prive pas les autres', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      let prevenu = false
      installation.subscribe(() => {
        throw new Error('abonné défaillant')
      })
      installation.subscribe(() => {
        prevenu = true
      })

      expect(() => win.dispatchEvent(new FausseInvite())).not.toThrow()
      expect(prevenu).toBe(true)
    })

    it('le désabonnement coupe les notifications', () => {
      const { win } = fenetre()
      const installation = new BrowserAppInstallation(win)
      let appels = 0
      const desabonner = installation.subscribe(() => {
        appels += 1
      })
      desabonner()

      win.dispatchEvent(new FausseInvite())
      expect(appels).toBe(0)
    })

    it('state() rend la même valeur tant que rien ne change', () => {
      const { win } = fenetre({ userAgent: UA.criOS, maxTouchPoints: 5 })
      const installation = new BrowserAppInstallation(win)
      expect(installation.state()).toBe(installation.state())
    })
  })
})
