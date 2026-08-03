import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { X01Config } from '@/core/domain/games/x01/config'
import { composeVisit } from '@/core/domain/games/x01/scoring'
import { Dart } from '@/core/domain/value-objects/Dart'

const config = X01Config.create()

/** Les 9 totaux qu'on ne peut pas faire en 3 fléchettes. */
const TOTAUX_IMPOSSIBLES = [179, 178, 176, 175, 173, 172, 169, 166, 163]

const total = (darts: readonly Dart[] | null): number =>
  (darts ?? []).reduce((somme, dart) => somme + Dart.points(dart), 0)

describe('composeVisit — saisie rapide', () => {
  it('rend exactement le score annoncé, sur le bon nombre de fléchettes', () => {
    const volee = composeVisit(85, 3, false, config)

    expect(total(volee)).toBe(85)
    expect(volee).toHaveLength(3)
  })

  it('compte les fléchettes d’une volée blanche', () => {
    const volee = composeVisit(0, 3, false, config)

    expect(volee).toHaveLength(3)
    expect(total(volee)).toBe(0)
  })

  it('fait finir la volée sur un double quand elle clôt le leg', () => {
    const volee = composeVisit(100, 3, true, config)

    expect(total(volee)).toBe(100)
    expect(volee).toHaveLength(3)
    expect(volee && Dart.isDouble(volee[volee.length - 1] ?? Dart.miss())).toBe(true)
  })

  it('respecte le nombre de fléchettes réellement lancées', () => {
    expect(composeVisit(40, 1, true, config)?.map(Dart.label)).toEqual(['D20'])
    expect(composeVisit(40, 3, true, config)).toHaveLength(3)
  })

  it('refuse une sortie impossible', () => {
    expect(composeVisit(169, 3, true, config)).toBeNull()
    expect(composeVisit(41, 1, true, config)).toBeNull()
  })

  it('refuse un nombre de fléchettes hors 1-3', () => {
    expect(() => composeVisit(60, 0, false, config)).toThrow(DomainError)
    expect(() => composeVisit(60, 4, false, config)).toThrow(DomainError)
  })

  /**
   * Le pavé rapide doit refuser un score qu'aucune volée ne peut produire.
   * Ce test découvre ces totaux plutôt que de les coder en dur.
   */
  it('rejette exactement les 9 totaux impossibles en 3 fléchettes', () => {
    const refuses: number[] = []

    for (let score = 1; score <= 180; score += 1) {
      const volee = composeVisit(score, 3, false, config)
      if (volee === null) {
        refuses.push(score)
        continue
      }
      expect(total(volee), `mauvais total pour ${score}`).toBe(score)
      expect(volee, `mauvais nombre de fléchettes pour ${score}`).toHaveLength(3)
    }

    expect(refuses.sort((a, b) => b - a)).toEqual(TOTAUX_IMPOSSIBLES)
  })
})
