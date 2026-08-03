import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import {
  BOGEY_NUMBERS,
  isOnACheckoutDouble,
  MAX_CHECKOUT,
  suggestCheckout,
} from '@/core/domain/games/x01/checkout'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'

const config = X01Config.create()
const labels = (remaining: number, dartsLeft = 3): string[] | null =>
  suggestCheckout(remaining, dartsLeft, config)?.map(Dart.label) ?? null

describe('suggestCheckout', () => {
  it('propose les sorties classiques', () => {
    expect(labels(170)).toEqual(['T20', 'T20', 'BULL'])
    expect(labels(167)).toEqual(['T20', 'T19', 'BULL'])
    expect(labels(100)).toEqual(['T20', 'D20'])
    expect(labels(40)).toEqual(['D20'])
    expect(labels(32)).toEqual(['D16'])
    expect(labels(50)).toEqual(['BULL'])
    expect(labels(2)).toEqual(['D1'])
  })

  it('ne propose rien au-dessus du checkout maximal', () => {
    expect(labels(MAX_CHECKOUT + 1)).toBeNull()
    expect(labels(180)).toBeNull()
  })

  it('ne propose rien sur un reste infinissable', () => {
    expect(labels(1)).toBeNull()
    expect(labels(0)).toBeNull()
  })

  it('respecte le nombre de fléchettes restantes', () => {
    expect(labels(40, 1)).toEqual(['D20'])
    expect(labels(41, 1)).toBeNull() // il faudrait 2 fléchettes
    expect(labels(100, 2)).toEqual(['T20', 'D20'])
    expect(labels(141, 2)).toBeNull() // 110 au maximum en 2 fléchettes
  })

  it('refuse un nombre de fléchettes hors 1-3', () => {
    expect(() => suggestCheckout(40, 0, config)).toThrow(DomainError)
    expect(() => suggestCheckout(40, 4, config)).toThrow(DomainError)
  })

  it('sort sur n’importe quelle fléchette quand le double out est désactivé', () => {
    const libre = X01Config.create({ doubleOut: false })
    expect(suggestCheckout(20, 1, libre)?.map(Dart.label)).toEqual(['S20'])
    expect(suggestCheckout(180, 3, libre)?.map(Dart.label)).toEqual(['T20', 'T20', 'T20'])
  })
})

describe('suggestCheckout — bogey numbers', () => {
  it('ne propose rien sur les 7 restes infinissables en 3 fléchettes', () => {
    for (const bogey of BOGEY_NUMBERS) {
      expect(labels(bogey), `${bogey} devrait être infinissable`).toBeNull()
    }
  })

  /**
   * Le test le plus important du module : il vérifie d'un coup que
   * l'algorithme trouve TOUTES les sorties réelles, qu'aucune route proposée
   * n'est fausse, et que la liste BOGEY_NUMBERS est exactement la bonne.
   */
  it('propose une route valide pour tout reste finissable de 2 à 170', () => {
    const infinissables: number[] = []

    for (let reste = 2; reste <= MAX_CHECKOUT; reste++) {
      const route = suggestCheckout(reste, 3, config)

      if (route === null) {
        infinissables.push(reste)
        continue
      }

      const total = route.reduce((somme, dart) => somme + Dart.points(dart), 0)
      const derniere = route.at(-1)

      expect(route.length, `route trop longue pour ${reste}`).toBeLessThanOrEqual(3)
      expect(total, `la route pour ${reste} ne fait pas le compte`).toBe(reste)
      expect(derniere && Dart.isDouble(derniere), `${reste} ne finit pas sur un double`).toBe(true)
    }

    expect(infinissables.sort((a, b) => b - a)).toEqual([...BOGEY_NUMBERS])
  })
})

describe('isOnACheckoutDouble', () => {
  it('reconnaît les restes qu’une seule fléchette peut clore', () => {
    expect(isOnACheckoutDouble(40, config)).toBe(true)
    expect(isOnACheckoutDouble(32, config)).toBe(true)
    expect(isOnACheckoutDouble(50, config)).toBe(true)
    expect(isOnACheckoutDouble(2, config)).toBe(true)
  })

  it('écarte les restes impairs, trop grands, ou nuls', () => {
    expect(isOnACheckoutDouble(41, config)).toBe(false)
    expect(isOnACheckoutDouble(42, config)).toBe(false)
    expect(isOnACheckoutDouble(0, config)).toBe(false)
    expect(isOnACheckoutDouble(1, config)).toBe(false)
  })

  it('ne s’applique pas sans double out', () => {
    expect(isOnACheckoutDouble(40, X01Config.create({ doubleOut: false }))).toBe(false)
  })
})
