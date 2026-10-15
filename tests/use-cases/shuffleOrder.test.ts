import { describe, expect, it } from 'vitest'
import type { RandomSource } from '@/core/application/ports/driven/RandomSource'
import { ShuffleOrderUseCase } from '@/core/application/use-cases/ShuffleOrderUseCase'
import { shufflePlayers } from '@/core/application/use-cases/shufflePlayers'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/** Un aléa scripté : le test dicte chaque tirage, dans l'ordre. */
const tirages = (...valeurs: readonly number[]): RandomSource => {
  let appel = 0
  return {
    nextInt: () => {
      const valeur = valeurs[appel] ?? 0
      appel += 1
      return valeur
    },
  }
}

const ids = (...noms: readonly string[]) => noms as unknown as readonly PlayerId[]

describe('ShuffleOrder — « Tirer au sort » de l’étape Ordre', () => {
  it('rend la permutation que dicte la source aléatoire', () => {
    // 3 joueurs : rang 2 tire 0 (A et C s'échangent), rang 1 tire 1 (B reste).
    const ordre = new ShuffleOrderUseCase(tirages(0, 1)).execute(ids('A', 'B', 'C'))
    expect(ordre).toEqual(['C', 'B', 'A'])
  })

  it('ne modifie pas la liste reçue', () => {
    const entree = ids('A', 'B', 'C')
    new ShuffleOrderUseCase(tirages(0, 1)).execute(entree)
    expect(entree).toEqual(['A', 'B', 'C'])
  })

  it('laisse une liste vide ou d’un seul joueur telle quelle, sans demander de tirage', () => {
    const jamais: RandomSource = {
      nextInt: () => {
        throw new Error('aucun tirage attendu')
      },
    }
    const cas = new ShuffleOrderUseCase(jamais)
    expect(cas.execute(ids())).toEqual([])
    expect(cas.execute(ids('A'))).toEqual(['A'])
  })

  it('rend le même résultat que `shufflePlayers` pour la même suite de tirages', () => {
    const joueurs = ids('A', 'B', 'C', 'D')
    expect(new ShuffleOrderUseCase(tirages(3, 2, 1)).execute(joueurs)).toEqual(
      shufflePlayers(joueurs, tirages(3, 2, 1)),
    )
  })

  it('peut redonner l’ordre reçu : vrai hasard, aucune relance', () => {
    // Chaque rang tire sa propre place : rien ne bouge, et c'est un résultat permis.
    const ordre = new ShuffleOrderUseCase(tirages(2, 1)).execute(ids('A', 'B', 'C'))
    expect(ordre).toEqual(['A', 'B', 'C'])
  })

  it('est câblé dans le composition root, sur la source aléatoire des autres use cases', () => {
    const { services } = fakeServices()
    const profils = ids('A', 'B', 'C')
    // `CyclingRandomSource` : 0 puis 1 au premier tirage, comme `tirages(0, 1)`.
    expect(services.shuffleOrder.execute(profils)).toEqual(['C', 'B', 'A'])
  })
})
