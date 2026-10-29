import type { QrScanner, QrScanState } from '@/core/application/ports/driven/QrScanner'
import { type BibliothequeQr, chargerBibliothequeQr, type ImageRvba } from '../qr/bibliothequeQr'

// ⚠️ Seul fichier de src/ qui ouvre la caméra (garde `reseauBoundary`) ; le flux n'en sort jamais.

type Piste = { stop(): void }
type Flux = { getTracks(): readonly Piste[] }

/** La part de `navigator.mediaDevices` que lit l'adapter, injectable pour les tests. */
export type Cameras = {
  getUserMedia(contraintes: {
    readonly video: { readonly facingMode: 'environment' }
    readonly audio: false
  }): Promise<Flux>
}

/** La part du `<video>` que touche l'adapter. */
export type Viseur = {
  srcObject: unknown
  muted: boolean
  playsInline: boolean
  play(): Promise<void> | undefined
}

/** Une image du viseur, ou `null` tant que la vidéo n'a rien à montrer. */
export type Capture = (viseur: Viseur) => ImageRvba | null

/** La part de `document` qui signale un onglet masqué. */
export type Page = EventTarget & { readonly hidden: boolean }

const COTE_MAX = 720
const INTERVALLE_MS = 80

// Carré central, réduit à 720 px au plus : assez pour un QR v6 vu à 30 cm.
const captureParToile = (): Capture => {
  let toile: HTMLCanvasElement | null = null
  return (viseur) => {
    const video = viseur as unknown as HTMLVideoElement
    if (video.readyState < 2 || video.videoWidth === 0) return null
    toile ??= document.createElement('canvas')
    const contexte = toile.getContext('2d', { willReadFrequently: true })
    if (!contexte) return null
    const cote = Math.min(video.videoWidth, video.videoHeight)
    const cible = Math.min(cote, COTE_MAX)
    toile.width = cible
    toile.height = cible
    const x = (video.videoWidth - cote) / 2
    const y = (video.videoHeight - cote) / 2
    contexte.drawImage(video, x, y, cote, cote, 0, 0, cible, cible)
    return contexte.getImageData(0, 0, cible, cible)
  }
}

const camerasDuNavigateur = (): Cameras | undefined => {
  if (typeof navigator === 'undefined') return undefined
  const cameras = navigator.mediaDevices as unknown as Partial<Cameras> | undefined
  return typeof cameras?.getUserMedia === 'function' ? (cameras as Cameras) : undefined
}

const pageDuNavigateur = (): Page | undefined =>
  typeof document === 'undefined' ? undefined : document

const IDLE: QrScanState = { status: 'idle' }

const issueDuRefus = (erreur: unknown): QrScanState => {
  const nom = (erreur as { readonly name?: unknown } | null)?.name
  if (nom === 'NotAllowedError' || nom === 'SecurityError') return { status: 'denied' }
  if (nom === 'NotFoundError' || nom === 'OverconstrainedError') return { status: 'absent' }
  return { status: 'failed' }
}

export class CameraQrScanner implements QrScanner<Viseur> {
  private etat: QrScanState
  private readonly abonnes = new Set<() => void>()
  private generation = 0
  private flux: Flux | null = null
  private viseur: Viseur | null = null
  private minuterie: ReturnType<typeof setTimeout> | undefined

  constructor(
    private readonly cameras: Cameras | undefined = camerasDuNavigateur(),
    private readonly charger: () => Promise<BibliothequeQr> = chargerBibliothequeQr,
    private readonly capturer: Capture = captureParToile(),
    page: Page | undefined = pageDuNavigateur(),
    private readonly intervalleMs = INTERVALLE_MS,
  ) {
    this.etat = cameras ? IDLE : { status: 'absent' }
    try {
      page?.addEventListener('visibilitychange', () => {
        if (page.hidden && this.flux !== null) this.stop()
      })
    } catch {}
  }

  state(): QrScanState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  start(viseur: Viseur): void {
    this.liberer()
    const cameras = this.cameras
    if (!cameras) {
      this.regler({ status: 'absent' })
      return
    }
    const generation = ++this.generation
    this.regler({ status: 'starting' })

    let demande: Promise<Flux>
    try {
      // Sans `await` préalable : iOS veut la caméra dans le geste de l'utilisateur.
      demande = cameras.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    } catch (erreur) {
      this.regler(issueDuRefus(erreur))
      return
    }
    void this.ouvrir(demande, viseur, generation)
  }

  stop(): void {
    this.generation += 1
    this.liberer()
    this.regler(this.cameras ? IDLE : { status: 'absent' })
  }

  private async ouvrir(demande: Promise<Flux>, viseur: Viseur, generation: number): Promise<void> {
    let flux: Flux
    try {
      flux = await demande
    } catch (erreur) {
      if (generation === this.generation) this.regler(issueDuRefus(erreur))
      return
    }
    if (generation !== this.generation) return arreter(flux)

    this.flux = flux
    this.viseur = viseur
    let bibliotheque: BibliothequeQr
    try {
      viseur.muted = true
      viseur.playsInline = true
      viseur.srcObject = flux
      await Promise.resolve(viseur.play()).catch(() => {})
      bibliotheque = await this.charger()
    } catch {
      if (generation !== this.generation) return
      this.liberer()
      return this.regler({ status: 'failed' })
    }
    if (generation !== this.generation) return
    this.regler({ status: 'scanning' })
    this.tour(bibliotheque, viseur, generation)
  }

  private tour(bibliotheque: BibliothequeQr, viseur: Viseur, generation: number): void {
    if (generation !== this.generation) return
    let lu: string | null = null
    try {
      const image = this.capturer(viseur)
      lu = image === null ? null : bibliotheque.decoder(image)
    } catch {
      lu = null
    }
    if (lu !== null) {
      this.generation += 1
      this.liberer()
      this.regler({ status: 'read', text: lu })
      return
    }
    this.minuterie = setTimeout(
      () => this.tour(bibliotheque, viseur, generation),
      this.intervalleMs,
    )
  }

  // Pistes arrêtées et viseur vidé : plus rien ne filme.
  private liberer(): void {
    if (this.minuterie !== undefined) clearTimeout(this.minuterie)
    this.minuterie = undefined
    if (this.flux !== null) arreter(this.flux)
    this.flux = null
    if (this.viseur !== null) {
      try {
        this.viseur.srcObject = null
      } catch {}
    }
    this.viseur = null
  }

  private regler(etat: QrScanState): void {
    this.etat = etat
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {}
    }
  }
}

const arreter = (flux: Flux): void => {
  try {
    for (const piste of flux.getTracks()) piste.stop()
  } catch {}
}
