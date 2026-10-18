import { describe, expect, it } from 'vitest'
import { horsCibleParPartie, moyenneParPartie, pluriel } from '@/ui/labels'

describe('moyenneParPartie — fléchettes hors cible par partie', () => {
  it('une décimale fixe, à la virgule : 41 sur 16 parties donne « 2,6 »', () => {
    expect(moyenneParPartie(41, 16)).toBe('2,6')
  })

  it('zéro hors cible : « 0,0 », la décimale reste écrite', () => {
    expect(moyenneParPartie(0, 16)).toBe('0,0')
  })

  it('aucune partie : « 0,0 », jamais NaN ni Infinity', () => {
    expect(moyenneParPartie(0, 0)).toBe('0,0')
    expect(moyenneParPartie(7, 0)).toBe('0,0')
  })

  it('arrondit à la décimale', () => {
    expect(moyenneParPartie(1, 3)).toBe('0,3')
    expect(moyenneParPartie(2, 3)).toBe('0,7')
    expect(moyenneParPartie(5, 2)).toBe('2,5')
  })

  it('une partie : le total entier, avec sa décimale', () => {
    expect(moyenneParPartie(9, 1)).toBe('9,0')
  })
})

describe('horsCibleParPartie — les trois morceaux de la ligne', () => {
  it('« Hors cible par partie », « 2,6 », « sur 16 parties »', () => {
    expect(horsCibleParPartie(41, 16)).toEqual({
      libelle: 'Hors cible par partie',
      moyenne: '2,6',
      base: 'sur 16 parties',
    })
  })

  it('une seule partie : « sur 1 partie » (singulier)', () => {
    expect(horsCibleParPartie(3, 1).base).toBe('sur 1 partie')
  })

  it('aucune partie : « sur 0 partie » — cas non atteint (la cible suppose une fléchette lancée), documenté', () => {
    expect(horsCibleParPartie(0, 0).base).toBe('sur 0 partie')
    // Même convention que `pluriel`, qui ne met au pluriel qu'à partir de 2.
    expect(pluriel(0, 'partie')).toBe('0 partie')
  })

  it('un grand nombre de parties : espace insécable des milliers (comme `nombre`)', () => {
    expect(horsCibleParPartie(2500, 1000).base).toBe(
      `sur ${(1000).toLocaleString('fr-FR')} parties`,
    )
  })
})
