import { describe, expect, it, vi } from 'vitest'
import {
  CameraQrScanner,
  type Cameras,
  type Page,
  type Viseur,
} from '@/infrastructure/device/CameraQrScanner'
import type { BibliothequeQr, ImageRvba } from '@/infrastructure/qr/bibliothequeQr'

class FausseCamera implements Cameras {
  demandes: unknown[] = []
  pistesArretees = 0
  reponse: () => Promise<{ getTracks(): { stop(): void }[] }>

  constructor(erreur?: { name: string }) {
    this.reponse = erreur ? () => Promise.reject(erreur) : () => Promise.resolve(this.flux())
  }

  flux() {
    return { getTracks: () => [{ stop: () => (this.pistesArretees += 1) }] }
  }

  getUserMedia(contraintes: unknown) {
    this.demandes.push(contraintes)
    return this.reponse()
  }
}

const IMAGE: ImageRvba = { data: new Uint8ClampedArray(4), width: 1, height: 1 }

const bibliotheque = (lu: string | null = 'JETON'): BibliothequeQr => ({
  encoder: () => {
    throw new Error('inutile ici')
  },
  decoder: () => lu,
})

const viseur = (): Viseur => ({
  srcObject: null,
  muted: false,
  playsInline: false,
  play: () => Promise.resolve(),
})

const banc = (
  options: {
    camera?: FausseCamera | undefined
    lu?: string | null
    charger?: () => Promise<BibliothequeQr>
  } = {},
) => {
  const camera = 'camera' in options ? options.camera : new FausseCamera()
  const chargements = { n: 0 }
  const charger =
    options.charger ??
    (() => {
      chargements.n += 1
      return Promise.resolve(bibliotheque(options.lu === undefined ? 'JETON' : options.lu))
    })
  const images = { n: 0 }
  const capture = () => {
    images.n += 1
    return images.n < 3 ? null : IMAGE
  }
  const page = Object.assign(new EventTarget(), { hidden: false }) as Page & { hidden: boolean }
  const scanner = new CameraQrScanner(camera, charger, capture, page, 1)
  return { scanner, camera, chargements, images, page }
}

describe('Adapter caméra du scan de QR', () => {
  it('rien n’est ouvert ni chargé à la construction', () => {
    const { scanner, camera, chargements } = banc()
    expect(scanner.state()).toEqual({ status: 'idle' })
    expect(camera?.demandes).toEqual([])
    expect(chargements.n).toBe(0)
  })

  it('caméra arrière, sans son, demandée dans le geste ; le premier QR lu arrête tout', async () => {
    const { scanner, camera } = banc()
    const v = viseur()
    scanner.start(v)

    // Synchrone : aucune attente avant la demande (iOS).
    expect(camera?.demandes).toEqual([{ video: { facingMode: 'environment' }, audio: false }])
    expect(scanner.state()).toEqual({ status: 'starting' })

    await vi.waitFor(() => expect(scanner.state()).toEqual({ status: 'read', text: 'JETON' }))
    expect(v.muted).toBe(true)
    expect(v.playsInline).toBe(true)
    expect(camera?.pistesArretees).toBe(1)
    expect(v.srcObject).toBeNull()
  })

  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'absent'],
    ['OverconstrainedError', 'absent'],
    ['NotReadableError', 'failed'],
  ])('refus %s : état %s, jamais d’exception', async (nom, etat) => {
    const { scanner } = banc({ camera: new FausseCamera({ name: nom }) })
    scanner.start(viseur())
    await vi.waitFor(() => expect(scanner.state()).toEqual({ status: etat }))
  })

  it('sans caméra du tout : absente, et `stop` n’y change rien', () => {
    const { scanner } = banc({ camera: undefined })
    expect(scanner.state()).toEqual({ status: 'absent' })
    scanner.start(viseur())
    scanner.stop()
    expect(scanner.state()).toEqual({ status: 'absent' })
  })

  it('arrêtée avant que la caméra réponde : le flux arrivé tard est coupé aussitôt', async () => {
    const camera = new FausseCamera()
    let livrer: () => void = () => {}
    camera.reponse = () =>
      new Promise((resoudre) => {
        livrer = () => resoudre(camera.flux())
      })
    const { scanner } = banc({ camera })
    const v = viseur()
    scanner.start(v)
    scanner.stop()
    livrer()

    await vi.waitFor(() => expect(camera.pistesArretees).toBe(1))
    expect(scanner.state()).toEqual({ status: 'idle' })
    expect(v.srcObject).toBeNull()
  })

  it('onglet masqué pendant le scan : la caméra s’arrête', async () => {
    const { scanner, camera, page } = banc({ lu: null })
    scanner.start(viseur())
    await vi.waitFor(() => expect(scanner.state()).toEqual({ status: 'scanning' }))

    page.hidden = true
    page.dispatchEvent(new Event('visibilitychange'))

    expect(camera?.pistesArretees).toBe(1)
    expect(scanner.state()).toEqual({ status: 'idle' })
  })

  it('bibliothèque introuvable : échec, et la caméra est rendue', async () => {
    const { scanner, camera } = banc({ charger: () => Promise.reject(new Error('hors ligne')) })
    scanner.start(viseur())
    await vi.waitFor(() => expect(scanner.state()).toEqual({ status: 'failed' }))
    expect(camera?.pistesArretees).toBe(1)
  })
})
