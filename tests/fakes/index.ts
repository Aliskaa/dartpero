import { createServices, type Dependencies, type Services } from '@/composition/container'
import { NullAnnouncer } from '@/core/application/ports/driven/Announcer'
import type { Clock } from '@/core/application/ports/driven/Clock'
import { NullHaptics } from '@/core/application/ports/driven/Haptics'
import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'
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

export const fakeDependencies = (): Dependencies => ({
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
  },
})

/** Le vrai composition root, câblé sur des adapters en mémoire. */
export const fakeServices = (): { services: Services; dependencies: Dependencies } => {
  const dependencies = fakeDependencies()
  return { services: createServices(dependencies), dependencies }
}
