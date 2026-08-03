import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import { GameModes } from '@/core/domain/games'
import {
  CheckoutPracticeConfig,
  playableTargets,
} from '@/core/domain/games/checkout-practice/config'
import {
  CheckoutPracticeRules,
  type CheckoutPracticeState,
} from '@/core/domain/games/checkout-practice/rules'
import { BOGEY_NUMBERS } from '@/core/domain/services/checkout'
import { Dart } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'

const KEVIN = PlayerId.of('kevin')
const COURT = CheckoutPracticeConfig.create({ rounds: 2 })

const journal = (
  volees: readonly (readonly [number, readonly Dart[]])[],
  config = COURT,
): readonly MatchEvent[] => {
  const events: MatchEvent[] = [
    { type: 'CheckoutPracticeStarted', config, playerIds: [KEVIN], startingPlayerIndex: 0 },
  ]
  for (const [cible, darts] of volees) {
    events.push({ type: 'RoundStarted', target: cible })
    events.push({ type: 'VisitRecorded', darts })
  }
  return events
}

const jouer = (
  volees: readonly (readonly [number, readonly Dart[]])[],
  config = COURT,
): CheckoutPracticeState => CheckoutPracticeRules.project(journal(volees, config))

describe('Checkout Practice — les cibles tirables', () => {
  /**
   * Le point qui rend l'exercice juste : on ne propose jamais un reste
   * impossible à finir en trois fléchettes.
   */
  it('exclut les bogey numbers, sans jamais consulter la liste', () => {
    const cibles = playableTargets(CheckoutPracticeConfig.create())

    for (const bogey of BOGEY_NUMBERS) expect(cibles).not.toContain(bogey)
    expect(cibles).toContain(170)
    expect(cibles).toContain(41)
    expect(cibles).toHaveLength(170 - 41 + 1 - BOGEY_NUMBERS.length)
  })

  it('respecte les bornes demandées', () => {
    const cibles = playableTargets(CheckoutPracticeConfig.create({ minTarget: 60, maxTarget: 70 }))

    expect(Math.min(...cibles)).toBeGreaterThanOrEqual(60)
    expect(Math.max(...cibles)).toBeLessThanOrEqual(70)
  })

  it('refuse une configuration absurde', () => {
    expect(() => CheckoutPracticeConfig.create({ rounds: 0 })).toThrow(DomainError)
    expect(() => CheckoutPracticeConfig.create({ minTarget: 100, maxTarget: 40 })).toThrow(
      DomainError,
    )
  })
})

describe('Checkout Practice — une manche', () => {
  it('compte une sortie réussie', () => {
    const state = jouer([[40, [Dart.double(20)]]])

    expect(state.roundsWon).toBe(1)
    expect(state.roundsPlayed).toBe(1)
    expect(state.successPercent).toBe(100)
    expect(state.rounds[0]?.outcome).toBe('CHECKOUT')
  })

  /** La même règle qu'en partie : finir hors d'un double ne compte pas. */
  it('refuse une sortie qui ne tombe pas sur un double', () => {
    const state = jouer([[40, [Dart.triple(20), Dart.miss(), Dart.miss()]]])

    expect(state.rounds[0]?.outcome).toBe('BUSTED')
    expect(state.roundsWon).toBe(0)
  })

  it('compte un bust quand on dépasse', () => {
    const state = jouer([[60, [Dart.triple(20), Dart.triple(20)]]])

    expect(state.rounds[0]?.outcome).toBe('BUSTED')
    expect(state.roundsWon).toBe(0)
  })

  it('compte une manche simplement ratée, sans bust', () => {
    const state = jouer([[100, [Dart.single(20), Dart.single(20), Dart.single(20)]]])

    expect(state.rounds[0]?.outcome).toBe('SCORED')
    expect(state.roundsWon).toBe(0)
    expect(state.roundsPlayed).toBe(1)
  })

  it('tronque la volée à la fléchette qui sort', () => {
    const state = jouer([[40, [Dart.double(20), Dart.triple(20), Dart.triple(20)]]])

    expect(state.rounds[0]?.darts).toHaveLength(1)
    expect(state.dartsThrown).toBe(1)
  })
})

describe('Checkout Practice — la session', () => {
  it('mesure la réussite en pourcentage', () => {
    const state = jouer([
      [40, [Dart.double(20)]],
      [60, [Dart.single(20), Dart.single(20), Dart.single(20)]],
    ])

    expect(state.roundsWon).toBe(1)
    expect(state.roundsPlayed).toBe(2)
    expect(state.successPercent).toBe(50)
    expect(state.finished).toBe(true)
  })

  it('réclame une nouvelle manche tant que la session n’est pas finie', () => {
    const apresUne = jouer([[40, [Dart.double(20)]]])

    expect(CheckoutPracticeRules.needsRound(apresUne)).toBe(true)
    expect(apresUne.finished).toBe(false)

    const apresDeux = jouer([
      [40, [Dart.double(20)]],
      [40, [Dart.double(20)]],
    ])
    expect(CheckoutPracticeRules.needsRound(apresDeux)).toBe(false)
    expect(apresDeux.finished).toBe(true)
  })

  it('refuse de jouer sans manche ouverte, ou après la fin', () => {
    const vierge = CheckoutPracticeRules.project(journal([]))
    expect(() => CheckoutPracticeRules.applyVisit(vierge, [Dart.double(20)])).toThrow(DomainError)

    const fini = jouer([
      [40, [Dart.double(20)]],
      [40, [Dart.double(20)]],
    ])
    expect(() => CheckoutPracticeRules.openRound(fini, 60)).toThrow(DomainError)
  })

  it('n’accepte qu’un seul joueur : c’est un exercice solo', () => {
    expect(() =>
      CheckoutPracticeRules.start({
        type: 'CheckoutPracticeStarted',
        config: COURT,
        playerIds: [KEVIN, PlayerId.of('julien')],
        startingPlayerIndex: 0,
      }),
    ).toThrow(DomainError)
  })

  /**
   * Les cibles vivent dans le journal : annuler redonne exactement la même
   * manche. Sans ça, on pourrait annuler jusqu'à tomber sur un reste facile.
   */
  it('rend la même cible après annulation', () => {
    const complet = journal([
      [121, [Dart.miss(), Dart.miss(), Dart.miss()]],
      [40, [Dart.double(20)]],
    ])

    const avant = CheckoutPracticeRules.project(complet.slice(0, -1))
    expect(avant.current?.target).toBe(40)

    // On rejoue exactement le même journal : la cible ne bouge pas.
    expect(CheckoutPracticeRules.project(complet.slice(0, -1)).current?.target).toBe(40)
  })
})

describe('Checkout Practice — la couture', () => {
  it('se reconnaît sur son événement d’ouverture', () => {
    const events = journal([[40, [Dart.double(20)]]])

    expect(GameModes.modeOf(events)).toBe('CHECKOUT_PRACTICE')
    expect(GameModes.isSolo('CHECKOUT_PRACTICE')).toBe(true)
    expect(GameModes.isSolo('X01')).toBe(false)
  })

  it('s’aiguille comme les autres modes', () => {
    const state = GameModes.project(journal([[40, [Dart.double(20)]]]))

    expect(state.mode).toBe('CHECKOUT_PRACTICE')
    expect(GameModes.currentPlayerId(state)).toBe(KEVIN)
    expect(GameModes.visitCount(state)).toBe(1)
    expect(GameModes.isFinished(state)).toBe(false)
  })
})
