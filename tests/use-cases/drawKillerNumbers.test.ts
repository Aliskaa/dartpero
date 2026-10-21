import { describe, expect, it } from 'vitest'
import { drawKillerNumbers } from '@/core/application/use-cases/drawKillerNumbers'
import { DomainError } from '@/core/domain/DomainError'
import { CyclingRandomSource, fakeServices } from '../fakes'

/** Le tirage des numéros du Killer : uniques, de 1 à 20, jamais la bulle. */
describe('Killer — tirage des numéros', () => {
  it('tire des numéros tous différents, entiers de 1 à 20', () => {
    for (let n = 0; n <= 20; n += 1) {
      const tires = drawKillerNumbers(n, [], new CyclingRandomSource())
      expect(tires).toHaveLength(n)
      expect(new Set(tires).size).toBe(n)
      for (const numero of tires) {
        expect(Number.isInteger(numero)).toBe(true)
        expect(numero).toBeGreaterThanOrEqual(1)
        expect(numero).toBeLessThanOrEqual(20)
      }
    }
  })

  it('n’est pas figé : la source d’aléa décide (un tirage ≠ 1, 2, 3…)', () => {
    const random = new CyclingRandomSource()
    expect(drawKillerNumbers(6, [], random)).toEqual([1, 3, 5, 7, 9, 11])
    expect(random.tirages).toBe(6)
  })

  it('évite les numéros exclus (un joueur ajouté reçoit un numéro libre)', () => {
    const pris = [1, 2, 3, 4, 5] as const
    const tires = drawKillerNumbers(15, pris, new CyclingRandomSource())

    expect(tires.some((numero) => (pris as readonly number[]).includes(numero))).toBe(false)
    expect([...tires].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 6))
  })

  it('refuse un tirage impossible : plus de numéros que de libres, nombre négatif', () => {
    expect(() => drawKillerNumbers(21, [], new CyclingRandomSource())).toThrow(DomainError)
    expect(() =>
      drawKillerNumbers(
        2,
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        new CyclingRandomSource(),
      ),
    ).toThrow(DomainError)
    expect(() => drawKillerNumbers(-1, [], new CyclingRandomSource())).toThrow(DomainError)
  })

  it('le port `drawKillerNumbers` des services passe par le même tirage', () => {
    const { services } = fakeServices()
    const tires = services.drawKillerNumbers.execute({ count: 6 })

    expect(new Set(tires).size).toBe(6)
    expect(services.drawKillerNumbers.execute({ count: 1, excluded: tires })).toHaveLength(1)
  })
})
