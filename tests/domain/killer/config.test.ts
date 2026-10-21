import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import {
  KILLER_LIVES,
  KILLER_MAX_PLAYERS,
  KILLER_MIN_PLAYERS,
  KILLER_NUMBERS,
  KillerConfig,
} from '@/core/domain/games/killer/config'

describe('Killer — configuration', () => {
  it('3 vies par défaut, variante désactivée', () => {
    expect(KillerConfig.create()).toEqual({ startingLives: 3, selfHitCostsLives: false })
  })

  it('5 vies et la variante au choix', () => {
    expect(KillerConfig.create({ startingLives: 5, selfHitCostsLives: true })).toEqual({
      startingLives: 5,
      selfHitCostsLives: true,
    })
  })

  it.each([0, 1, 2, 4, 6, 3.5, Number.NaN])('refuse %s vies (liste fermée 3 ou 5)', (vies) => {
    expect(() => KillerConfig.create({ startingLives: vies })).toThrow(DomainError)
  })

  it('refuse une variante mal typée (venue d’un fichier)', () => {
    expect(() => KillerConfig.create({ selfHitCostsLives: 'oui' as unknown as boolean })).toThrow(
      DomainError,
    )
    expect(() => KillerConfig.create({ selfHitCostsLives: 1 as unknown as boolean })).toThrow(
      DomainError,
    )
  })

  it('les constantes de jeu : 1 à 20 sans la bulle, 3 ou 5 vies, 2 à 6 joueurs', () => {
    expect(KILLER_NUMBERS).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect(KILLER_LIVES).toEqual([3, 5])
    expect([KILLER_MIN_PLAYERS, KILLER_MAX_PLAYERS]).toEqual([2, 6])
  })
})
