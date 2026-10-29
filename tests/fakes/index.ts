import { createServices, type Dependencies, type Services } from '@/composition/container'
import {
  type Annonce,
  type Announcer,
  NullAnnouncer,
} from '@/core/application/ports/driven/Announcer'
import {
  type AppInstallation,
  type InstallOutcome,
  type InstallState,
  NullAppInstallation,
} from '@/core/application/ports/driven/AppInstallation'
import type { Clock } from '@/core/application/ports/driven/Clock'
import { NullHaptics } from '@/core/application/ports/driven/Haptics'
import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'
import type {
  PeerAnswerResult,
  PeerLink,
  PeerLinkState,
  PeerLinks,
  PeerOfferResult,
} from '@/core/application/ports/driven/PeerLinks'
import type {
  PersistentStorage,
  StorageProtection,
} from '@/core/application/ports/driven/PersistentStorage'
import { createMemoryPreferences } from '@/core/application/ports/driven/Preferences'
import type { QrEncoder, QrMatrix } from '@/core/application/ports/driven/QrEncoder'
import type { QrScanner, QrScanState } from '@/core/application/ports/driven/QrScanner'
import type { RandomSource } from '@/core/application/ports/driven/RandomSource'
import { NullScreenLock } from '@/core/application/ports/driven/ScreenLock'
import { InMemoryMatchRepository } from '@/infrastructure/memory/InMemoryMatchRepository'
import { InMemoryPlayerRepository } from '@/infrastructure/memory/InMemoryPlayerRepository'
import { InMemoryVisitDraftRepository } from '@/infrastructure/memory/InMemoryVisitDraftRepository'

/** Horloge déterministe qui avance d'un pas à chaque lecture. */
export class TickingClock implements Clock {
  private courant: number

  constructor(
    debut = 1_700_000_000_000,
    private readonly pas = 1000,
  ) {
    this.courant = debut
  }

  now(): number {
    const valeur = this.courant
    this.courant += this.pas
    return valeur
  }
}

export class SettableClock implements Clock {
  constructor(private courant = Date.UTC(2026, 7, 26, 12)) {}

  now(): number {
    return this.courant
  }

  /** Se placer à un instant précis, en heure locale du test. */
  regler(instant: number): void {
    this.courant = instant
  }
}

/** Identifiants prévisibles : id-1, id-2, id-3… */
export class SequentialIdGenerator implements IdGenerator {
  private compteur = 0

  newId(): string {
    this.compteur += 1
    return `id-${this.compteur}`
  }
}

export class CyclingRandomSource implements RandomSource {
  private appel = 0

  nextInt(max: number): number {
    if (max <= 0) return 0
    const valeur = this.appel % max
    this.appel += 1
    return valeur
  }

  /** Le nombre de tirages faits : prouve qu'une reprise ne re-tire rien. */
  get tirages(): number {
    return this.appel
  }
}

export class FakePersistentStorage implements PersistentStorage {
  statusCalls = 0
  requestCalls = 0

  constructor(
    public etat: StorageProtection = 'not-persisted',
    private readonly options: {
      readonly accorde?: boolean
      readonly requestBloquee?: boolean
    } = {},
  ) {}

  async status(): Promise<StorageProtection> {
    this.statusCalls += 1
    return this.etat
  }

  async request(): Promise<StorageProtection> {
    this.requestCalls += 1
    if (this.options.requestBloquee) return new Promise<StorageProtection>(() => {})
    if (this.etat !== 'unavailable' && (this.options.accorde ?? true)) this.etat = 'persisted'
    return this.etat
  }
}

export class FakeAppInstallation implements AppInstallation {
  promptCalls = 0
  private readonly abonnes = new Set<() => void>()

  constructor(
    private etat: InstallState = 'unavailable',
    public issue: InstallOutcome = 'dismissed',
  ) {}

  state(): InstallState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  async prompt(): Promise<InstallOutcome> {
    this.promptCalls += 1
    if (this.etat !== 'installable') return 'unavailable'
    this.regler('unavailable')
    return this.issue
  }

  regler(etat: InstallState): void {
    this.etat = etat
    for (const abonne of [...this.abonnes]) abonne()
  }

  /** Le nombre d'abonnés en cours : un désabonnement oublié se voit ici. */
  get abonnements(): number {
    return this.abonnes.size
  }
}

export class DepotSuspendu extends InMemoryMatchRepository {
  ecritures = 0
  private porte: Promise<void> | null = null
  private ouvrir: (() => void) | null = null

  suspendre(): void {
    this.porte = new Promise<void>((resolve) => {
      this.ouvrir = resolve
    })
  }

  liberer(): void {
    this.ouvrir?.()
    this.porte = null
  }

  override async save(record: Parameters<InMemoryMatchRepository['save']>[0]): Promise<void> {
    this.ecritures += 1
    if (this.porte) await this.porte
    await super.save(record)
  }
}

/** Un dépôt de parties qui compte ses lectures : prouve qu'une écriture ne relit pas le journal. */
export class DepotCompteur extends InMemoryMatchRepository {
  lectures = 0

  override async findById(
    id: Parameters<InMemoryMatchRepository['findById']>[0],
  ): ReturnType<InMemoryMatchRepository['findById']> {
    this.lectures += 1
    return super.findById(id)
  }
}

export class DepotEnPanne extends InMemoryMatchRepository {
  panne = false

  override async save(record: Parameters<InMemoryMatchRepository['save']>[0]): Promise<void> {
    if (this.panne) throw new Error('disque plein')
    await super.save(record)
  }
}

/** Un dépôt de brouillons qu'on ne relit plus : chaque `findById` rejette, le reste marche. */
export class BrouillonsIllisibles extends InMemoryVisitDraftRepository {
  override async findById(): ReturnType<InMemoryVisitDraftRepository['findById']> {
    throw new Error('disque illisible')
  }
}

/** Un dépôt de brouillons qui lit et écrit, mais dont chaque effacement rejette. */
export class BrouillonsIndelebiles extends InMemoryVisitDraftRepository {
  override async delete(): Promise<void> {
    throw new Error('disque plein')
  }
}

/** Un dépôt de brouillons hors service : chaque écriture et chaque effacement rejettent. */
export class BrouillonsEnPanne extends InMemoryVisitDraftRepository {
  override async save(): Promise<void> {
    throw new Error('disque plein')
  }

  override async delete(): Promise<void> {
    throw new Error('disque plein')
  }
}

export class BrouillonsSuspendus extends InMemoryVisitDraftRepository {
  ecritures = 0
  lectures = 0
  private porte: Promise<void> | null = null
  private ouvrir: (() => void) | null = null

  suspendre(): void {
    this.porte = new Promise<void>((resolve) => {
      this.ouvrir = resolve
    })
  }

  liberer(): void {
    this.ouvrir?.()
    this.porte = null
  }

  override async save(draft: Parameters<InMemoryVisitDraftRepository['save']>[0]): Promise<void> {
    this.ecritures += 1
    if (this.porte) await this.porte
    await super.save(draft)
  }

  override async delete(
    matchId: Parameters<InMemoryVisitDraftRepository['delete']>[0],
  ): Promise<void> {
    this.ecritures += 1
    if (this.porte) await this.porte
    await super.delete(matchId)
  }

  override async findById(
    matchId: Parameters<InMemoryVisitDraftRepository['findById']>[0],
  ): ReturnType<InMemoryVisitDraftRepository['findById']> {
    this.lectures += 1
    return super.findById(matchId)
  }
}

/** La voix en mémoire : garde les annonces (segments typés par langue) telles que reçues. */
export class FakeAnnouncer implements Announcer {
  readonly annonces: Annonce[] = []
  annulations = 0

  say(annonce: Annonce): void {
    this.annonces.push(annonce)
  }

  cancel(): void {
    this.annulations += 1
  }

  /** Chaque annonce recollée en une phrase, sans la langue. */
  get textes(): string[] {
    return this.annonces.map((annonce) => annonce.map((segment) => segment.texte).join(''))
  }
}

/** Une extrémité d'un lien en mémoire ; livre ses messages tout de suite, et seulement ouvert. */
export class FakePeerLink implements PeerLink {
  etat: PeerLinkState = 'connecting'
  pair: FakePeerLink | null = null
  envois: string[] = []
  private readonly abonnes = new Set<() => void>()
  private readonly ecouteurs = new Set<(texte: string) => void>()

  state(): PeerLinkState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  send(texte: string): void {
    if (this.etat !== 'open') return
    this.envois.push(texte)
    if (this.pair?.etat === 'open') this.pair.livrer(texte)
  }

  onMessage(listener: (texte: string) => void): () => void {
    this.ecouteurs.add(listener)
    return () => {
      this.ecouteurs.delete(listener)
    }
  }

  close(): void {
    if (this.etat === 'closed') return
    this.regler('closed')
    // L'autre bout voit seulement le lien tomber.
    if (this.pair && this.pair.etat !== 'closed') this.pair.regler('lost')
  }

  /** Le nombre d'écouteurs de messages : la saisie doit rester à zéro. */
  get ecoutes(): number {
    return this.ecouteurs.size
  }

  livrer(texte: string): void {
    for (const ecouteur of [...this.ecouteurs]) ecouteur(texte)
  }

  regler(etat: PeerLinkState): void {
    if (this.etat === 'closed' || this.etat === etat) return
    this.etat = etat
    for (const abonne of [...this.abonnes]) abonne()
  }
}

/** Le réseau local en mémoire, partagé par deux `fakeServices` : offres, réponses, coupures. */
export class ReseauFactice {
  private compteur = 0
  readonly offres = new Map<string, FakePeerLink>()
  readonly reponses = new Map<string, { offre: string; lien: FakePeerLink }>()
  /** Les paires établies, la plus récente en dernier. */
  readonly paires: { saisie: FakePeerLink; miroir: FakePeerLink }[] = []

  jeton(prefixe: string): string {
    this.compteur += 1
    return `${prefixe}-${this.compteur}`
  }

  get derniere(): { saisie: FakePeerLink; miroir: FakePeerLink } {
    const paire = this.paires.at(-1)
    if (!paire) throw new Error('aucun lien établi')
    return paire
  }

  couper(): void {
    for (const lien of Object.values(this.derniere)) lien.regler('lost')
  }

  retablir(): void {
    for (const lien of Object.values(this.derniere)) lien.regler('open')
  }
}

export class FakePeerLinks implements PeerLinks {
  offresFaites = 0
  reponsesFaites = 0

  constructor(
    readonly reseau = new ReseauFactice(),
    private readonly options: { readonly indisponible?: boolean } = {},
  ) {}

  async offer(): Promise<PeerOfferResult> {
    this.offresFaites += 1
    if (this.options.indisponible) return { ok: false, reason: 'unavailable' }
    const reseau = this.reseau
    const token = reseau.jeton('OFFRE')
    const lien = new FakePeerLink()
    reseau.offres.set(token, lien)
    return {
      ok: true,
      offer: {
        token,
        link: lien,
        accept: async (answerToken) => {
          if (answerToken === 'INCOMPATIBLE') return 'incompatible'
          const reponse = reseau.reponses.get(answerToken)
          if (!reponse || reponse.offre !== token) return 'unreadable'
          lien.pair = reponse.lien
          reponse.lien.pair = lien
          reseau.paires.push({ saisie: lien, miroir: reponse.lien })
          lien.regler('open')
          reponse.lien.regler('open')
          return null
        },
      },
    }
  }

  async answer(offerToken: string): Promise<PeerAnswerResult> {
    this.reponsesFaites += 1
    if (this.options.indisponible) return { ok: false, reason: 'unavailable' }
    if (offerToken === 'INCOMPATIBLE') return { ok: false, reason: 'incompatible' }
    if (!this.reseau.offres.has(offerToken)) return { ok: false, reason: 'unreadable' }
    const token = this.reseau.jeton('REPONSE')
    const lien = new FakePeerLink()
    this.reseau.reponses.set(token, { offre: offerToken, lien })
    return { ok: true, token, link: lien }
  }
}

/** Le scanner en mémoire : `lire(texte)` simule un QR vu par la caméra. */
export class FakeQrScanner implements QrScanner<unknown> {
  demarrages = 0
  private etat: QrScanState = { status: 'idle' }
  private readonly abonnes = new Set<() => void>()

  state(): QrScanState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  start(): void {
    this.demarrages += 1
    this.regler({ status: 'scanning' })
  }

  stop(): void {
    this.regler({ status: 'idle' })
  }

  lire(texte: string): void {
    this.regler({ status: 'read', text: texte })
  }

  regler(etat: QrScanState): void {
    this.etat = etat
    for (const abonne of [...this.abonnes]) abonne()
  }
}

export class FakeQrEncoder implements QrEncoder {
  readonly textes: string[] = []

  async encode(texte: string): Promise<QrMatrix | null> {
    this.textes.push(texte)
    return {
      size: 21,
      version: 1,
      modules: Array.from({ length: 21 }, () => Array(21).fill(false)),
    }
  }
}

export const fakeDependencies = (surcharges: Partial<Dependencies> = {}): Dependencies => ({
  matches: new InMemoryMatchRepository(),
  players: new InMemoryPlayerRepository(),
  visitDrafts: new InMemoryVisitDraftRepository(),
  clock: new TickingClock(),
  ids: new SequentialIdGenerator(),
  random: new CyclingRandomSource(),
  peerLinks: new FakePeerLinks(),
  devices: {
    screenLock: NullScreenLock,
    haptics: NullHaptics,
    preferences: createMemoryPreferences(),
    announcer: NullAnnouncer,
    persistentStorage: new FakePersistentStorage(),
    appInstallation: NullAppInstallation,
    qrScanner: new FakeQrScanner(),
    qrEncoder: new FakeQrEncoder(),
  },
  ...surcharges,
})

/** Le vrai composition root, câblé sur des adapters en mémoire. */
export const fakeServices = (
  surcharges: Partial<Dependencies> = {},
): { services: Services; dependencies: Dependencies } => {
  const dependencies = fakeDependencies(surcharges)
  return { services: createServices(dependencies), dependencies }
}
