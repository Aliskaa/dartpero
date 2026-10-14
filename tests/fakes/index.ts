import { createServices, type Dependencies, type Services } from '@/composition/container'
import { NullAnnouncer } from '@/core/application/ports/driven/Announcer'
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

/**
 * Horloge que le test déplace à la main.
 *
 * Indispensable dès qu'une donnée est **datée** : `TickingClock` avance d'une
 * seconde, donc toutes les parties qu'elle crée tombent le même soir — ce qui
 * ne permet pas de vérifier un filtre de période.
 */
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

/**
 * Aléa déterministe : parcourt les valeurs en boucle plutôt que de renvoyer
 * toujours la même. Un tirage figé masquerait les bugs de tirage — comme une
 * cible qui ne changerait jamais d'une manche à l'autre.
 */
export class CyclingRandomSource implements RandomSource {
  private appel = 0

  nextInt(max: number): number {
    if (max <= 0) return 0
    const valeur = this.appel % max
    this.appel += 1
    return valeur
  }
}

/**
 * Stockage persistant espion : état initial réglable, compteurs d'appels.
 * `accorde` dit ce que répondra `request()` ; `requestBloquee` ne la résout
 * jamais (prouve que le rendu n'attend pas la demande).
 */
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

/**
 * Installation réglable : `regler()` change l'état et prévient les abonnés,
 * comme l'adapter à l'arrivée d'une invite ou après `appinstalled`.
 * `promptCalls` compte **chaque** appel à `prompt()`, utile ou non : un double
 * appel se voit. `issue` dit ce qu'ouvrira l'invite. Comme l'adapter, hors
 * `installable` l'appel répond `unavailable`, et une invite consommée laisse
 * `unavailable`.
 */
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

/**
 * Un dépôt de parties dont l'écriture peut être suspendue : un fake, pas un mock.
 * `suspendre()` bloque les `save` suivants jusqu'à `liberer()` ; `ecritures`
 * compte les appels (suspendus compris).
 */
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
export const fakeDependencies = (surcharges: Partial<Dependencies> = {}): Dependencies => ({
  matches: new InMemoryMatchRepository(),
  players: new InMemoryPlayerRepository(),
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
