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
  PersistentStorage,
  StorageProtection,
} from '@/core/application/ports/driven/PersistentStorage'
import { createMemoryPreferences } from '@/core/application/ports/driven/Preferences'
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

export const fakeDependencies = (surcharges: Partial<Dependencies> = {}): Dependencies => ({
  matches: new InMemoryMatchRepository(),
  players: new InMemoryPlayerRepository(),
  visitDrafts: new InMemoryVisitDraftRepository(),
  clock: new TickingClock(),
  ids: new SequentialIdGenerator(),
  random: new CyclingRandomSource(),
  devices: {
    screenLock: NullScreenLock,
    haptics: NullHaptics,
    preferences: createMemoryPreferences(),
    announcer: NullAnnouncer,
    persistentStorage: new FakePersistentStorage(),
    appInstallation: NullAppInstallation,
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
