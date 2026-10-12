import { describe, expect, it } from 'vitest'
import { decalage, deplacer, rangVise } from '@/ui/ecrans/nouvelle-partie/ordre'

describe('Ordre de jeu — deplacer', () => {
  it('déplace vers le bas et vers le haut, les autres glissant d’un cran', () => {
    expect(deplacer(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(deplacer(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('rend la liste telle quelle sans déplacement ou hors bornes', () => {
    const liste = ['a', 'b', 'c'] as const
    expect(deplacer(liste, 1, 1)).toBe(liste)
    expect(deplacer(liste, 0, -1)).toBe(liste)
    expect(deplacer(liste, 2, 3)).toBe(liste)
    expect(deplacer(liste, 5, 0)).toBe(liste)
  })

  it('ne modifie jamais la liste d’origine', () => {
    const liste = ['a', 'b', 'c']
    deplacer(liste, 0, 2)
    expect(liste).toEqual(['a', 'b', 'c'])
  })
})

describe('Ordre de jeu — rangVise', () => {
  // Trois lignes de 50 px : milieux à 25, 75, 125 ; seuils à 50 et 100.
  const milieux = [25, 75, 125]

  it('reste en place tant que le centre n’a pas fait une demi-ligne', () => {
    expect(rangVise(milieux, 0, 25)).toBe(0)
    expect(rangVise(milieux, 0, 50)).toBe(0)
    expect(rangVise(milieux, 1, 51)).toBe(1)
    expect(rangVise(milieux, 1, 99)).toBe(1)
  })

  it('prend la place la plus proche de son centre, vers le bas comme vers le haut', () => {
    expect(rangVise(milieux, 0, 51)).toBe(1)
    expect(rangVise(milieux, 0, 101)).toBe(2)
    expect(rangVise(milieux, 2, 99)).toBe(1)
    expect(rangVise(milieux, 2, 49)).toBe(0)
  })
})

/**
 * Constat n° 1 de la revue. La borne du geste arrête le centre de la ligne
 * tenue **exactement** sur le milieu de la première / dernière ligne (à
 * hauteurs égales) : ces valeurs-là sont les seules qui comptent, puisque ce
 * sont les seules que le doigt peut atteindre au bout de la liste.
 */
describe('Ordre de jeu — rangVise à la borne du geste', () => {
  // Lignes de 56 px, filet de 8 px : milieux à 28, 92, 156, 220.
  const quatre = [28, 92, 156, 220]

  it('à deux lignes, la borne basse donne la dernière place et la borne haute la première', () => {
    const deux = [28, 92]
    expect(rangVise(deux, 0, 92)).toBe(1)
    expect(rangVise(deux, 1, 28)).toBe(0)
  })

  it('du premier rang, la borne basse donne la dernière place, à trois et à quatre', () => {
    expect(rangVise([28, 92, 156], 0, 156)).toBe(2)
    expect(rangVise(quatre, 0, 220)).toBe(3)
  })

  it('du dernier rang, la borne haute donne la première place, à trois et à quatre', () => {
    expect(rangVise([28, 92, 156], 2, 28)).toBe(0)
    expect(rangVise(quatre, 3, 28)).toBe(0)
  })

  it('du rang du milieu, chaque borne donne son extrémité', () => {
    expect(rangVise([28, 92, 156], 1, 156)).toBe(2)
    expect(rangVise([28, 92, 156], 1, 28)).toBe(0)
  })
})

describe('Ordre de jeu — decalage', () => {
  it('fait remonter d’un pas les lignes enjambées vers le bas', () => {
    expect([0, 1, 2, 3].map((rang) => decalage(rang, 0, 2, 50))).toEqual([0, -50, -50, 0])
  })

  it('fait descendre d’un pas les lignes enjambées vers le haut', () => {
    expect([0, 1, 2, 3].map((rang) => decalage(rang, 3, 1, 50))).toEqual([0, 50, 50, 0])
  })

  it('ne décale rien sans déplacement', () => {
    expect([0, 1, 2].map((rang) => decalage(rang, 1, 1, 50))).toEqual([0, 0, 0])
  })
})
