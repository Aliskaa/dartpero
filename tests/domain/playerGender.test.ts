import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { Player } from '@/core/domain/entities/Player'
import { PlayerId } from '@/core/domain/value-objects/ids'
import { PLAYER_GENDERS, PlayerGender } from '@/core/domain/value-objects/PlayerGender'

describe('PlayerGender', () => {
  it('la liste fermée tient en deux valeurs persistées', () => {
    expect(PLAYER_GENDERS).toEqual(['MASCULINE', 'FEMININE'])
  })

  it.each(['MASCULINE', 'FEMININE'])('accepte %s', (valeur) => {
    expect(PlayerGender.of(valeur)).toBe(valeur)
  })

  it.each(['', 'feminine', 'UNSPECIFIED', 'NON_PRECISE', 'X'])('refuse « %s »', (valeur) => {
    expect(() => PlayerGender.of(valeur)).toThrow(DomainError)
  })
})

describe('Player.create et le genre', () => {
  const id = PlayerId.of('sarah')

  it('sans genre, la clé `gender` est absente (jamais `gender: undefined`)', () => {
    const joueur = Player.create(id, 'Sarah', 'brique', 1)

    expect('gender' in joueur).toBe(false)
    expect('gender' in Player.create(id, 'Sarah', 'brique', 1, undefined)).toBe(false)
  })

  it('avec un genre, il le garde', () => {
    expect(Player.create(id, 'Sarah', 'brique', 1, 'FEMININE').gender).toBe('FEMININE')
  })
})
