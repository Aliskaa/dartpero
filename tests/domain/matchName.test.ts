import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { type MatchEvent, nameOf } from '@/core/domain/events/MatchEvent'
import { GameModes } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'
import { MATCH_NAME_MAX_LENGTH, MatchName } from '@/core/domain/value-objects/MatchName'

const kevin = PlayerId.of('kevin')
const julien = PlayerId.of('julien')
const finale = MatchName.of('Finale des potes') as MatchName

/** Les quatre ouvertures, sans nom — et de quoi les rendre projetables. */
const OUVERTURES: readonly (readonly [string, readonly MatchEvent[]])[] = [
  [
    'X01',
    [
      {
        type: 'MatchStarted',
        config: X01Config.create({}),
        playerIds: [kevin, julien],
        startingPlayerIndex: 0,
      },
    ],
  ],
  [
    'Tour du monde',
    [
      {
        type: 'TourDuMondeStarted',
        config: TourDuMondeConfig.create(),
        playerIds: [kevin, julien],
        startingPlayerIndex: 0,
      },
    ],
  ],
  [
    'Cricket',
    [
      {
        type: 'CricketStarted',
        config: CricketConfig.create(),
        playerIds: [kevin, julien],
        startingPlayerIndex: 1,
      },
    ],
  ],
  [
    'Killer',
    [
      {
        type: 'KillerStarted',
        config: KillerConfig.create(),
        playerIds: [kevin, julien],
        numbers: [8, 14],
        startingPlayerIndex: 0,
      },
    ],
  ],
  [
    'entraînement',
    [
      {
        type: 'CheckoutPracticeStarted',
        config: CheckoutPracticeConfig.create({ rounds: 3 }),
        playerIds: [kevin],
        startingPlayerIndex: 0,
      },
      { type: 'RoundStarted', target: 40 },
    ],
  ],
]

const nommer = (events: readonly MatchEvent[], name: MatchName): readonly MatchEvent[] => {
  const [ouverture, ...suite] = events
  if (!ouverture) throw new Error('journal vide')
  return [{ ...ouverture, name } as MatchEvent, ...suite]
}

describe('MatchName — le nom tapé d’une partie', () => {
  it('retire les espaces de début et de fin', () => {
    expect(MatchName.of('  Finale des potes  ')).toBe('Finale des potes')
  })

  it('garde les espaces intérieurs tels quels (pas comme un pseudo)', () => {
    expect(MatchName.of('Finale   des potes')).toBe('Finale   des potes')
  })

  it.each(['', ' ', '      ', '\t\n'])('ne fait pas un nom de %j : absence, pas erreur', (vide) => {
    expect(MatchName.of(vide)).toBeNull()
  })

  it(`accepte ${MATCH_NAME_MAX_LENGTH} caractères, refuse le suivant`, () => {
    expect(MATCH_NAME_MAX_LENGTH).toBe(30)
    expect(MatchName.of('a'.repeat(30))).toBe('a'.repeat(30))
    expect(() => MatchName.of('a'.repeat(31))).toThrow(DomainError)
  })

  it('compte la longueur après le nettoyage', () => {
    expect(MatchName.of(`   ${'a'.repeat(30)}   `)).toBe('a'.repeat(30))
  })

  it('ne tronque jamais un nom trop long : il le refuse', () => {
    let resultat: unknown = 'non appelé'
    try {
      resultat = MatchName.of('b'.repeat(45))
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(DomainError)
      expect((erreur as Error).message).toContain('45')
    }
    expect(resultat).toBe('non appelé')
  })
})

describe('nameOf — le nom lu sur l’ouverture', () => {
  it.each(OUVERTURES)('rend le nom d’une ouverture %s nommée', (_, events) => {
    expect(nameOf(nommer(events, finale))).toBe('Finale des potes')
  })

  it.each(OUVERTURES)('rend null sur une ouverture %s sans nom', (_, events) => {
    expect(nameOf(events)).toBeNull()
  })

  it('rend null sur un journal vide', () => {
    expect(nameOf([])).toBeNull()
  })

  it('rend null quand le premier événement n’est pas une ouverture', () => {
    expect(nameOf([{ type: 'VisitRecorded', darts: [Dart.single(20)] }])).toBeNull()
    expect(nameOf([{ type: 'RoundStarted', target: 40 }])).toBeNull()
  })

  /**
   * Un événement suivant qui porterait un nom — une seconde ouverture nommée,
   * ou un `name` égaré sur une volée (journal abîmé) — ne compte pas : seule
   * l'ouverture nomme la partie.
   */
  it('ne lit que l’ouverture, jamais un événement suivant qui porterait un nom', () => {
    const [, events] = OUVERTURES[0] ?? ['', []]
    const [, cricket] = OUVERTURES[2] ?? ['', []]
    const autre = MatchName.of('Intrus') as MatchName
    const suite = [
      { type: 'VisitRecorded', darts: [Dart.single(20)], name: autre } as MatchEvent,
      ...nommer(cricket, autre),
    ]

    expect(nameOf([...events, ...suite])).toBeNull()
    expect(nameOf([...nommer(events, finale), ...suite])).toBe('Finale des potes')
  })
})

describe('Une ouverture nommée ne change aucune règle', () => {
  it.each(OUVERTURES)('%s : la projection est identique avec ou sans nom', (_, events) => {
    expect(GameModes.project(nommer(events, finale))).toEqual(GameModes.project(events))
  })
})
