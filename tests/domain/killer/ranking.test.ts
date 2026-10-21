import { describe, expect, it } from 'vitest'
import { KillerRules } from '@/core/domain/games/killer/rules'
import { Dart } from '@/core/domain/value-objects/Dart'
import { JULIEN, jouer, KEVIN, ouverture, PAUL, SARAH } from './helpers'

/** Règle 9 : classement par ordre d'élimination, le dernier éliminé 2e. */
describe('Killer — classement', () => {
  const A_QUATRE = ouverture({ playerIds: [KEVIN, JULIEN, SARAH, PAUL] })

  it('partie finie : gagnant 1er, puis les éliminés dans l’ordre inverse, rangs distincts', () => {
    // Kevin (8) élimine Julien (14), puis Paul (11), puis Sarah (3).
    const etat = jouer(A_QUATRE, [
      [Dart.double(8), Dart.triple(14)],
      [Dart.miss()],
      [Dart.miss()],
      [Dart.triple(11)],
      [Dart.miss()],
      [Dart.triple(3)],
    ])

    expect(etat.finished).toBe(true)
    expect(KillerRules.ranking(etat)).toEqual([
      { playerId: KEVIN, rank: 1 },
      { playerId: SARAH, rank: 2 },
      { playerId: PAUL, rank: 3 },
      { playerId: JULIEN, rank: 4 },
    ])
  })

  it('en cours : vivants par vies décroissantes, ex æquo au même rang, ordre de jeu pour l’affichage', () => {
    // Kevin killer retire 1 vie à Julien ; Kevin, Sarah et Paul ont 3 vies.
    const etat = jouer(A_QUATRE, [[Dart.double(8), Dart.single(14)]])

    expect(KillerRules.ranking(etat)).toEqual([
      { playerId: KEVIN, rank: 1 },
      { playerId: SARAH, rank: 1 },
      { playerId: PAUL, rank: 1 },
      { playerId: JULIEN, rank: 4 },
    ])
  })

  it('en cours : les éliminés passent derrière tous les vivants', () => {
    const etat = jouer(A_QUATRE, [[Dart.double(8), Dart.triple(14), Dart.single(3)]])

    expect(KillerRules.ranking(etat)).toEqual([
      { playerId: KEVIN, rank: 1 },
      { playerId: PAUL, rank: 1 },
      { playerId: SARAH, rank: 3 },
      { playerId: JULIEN, rank: 4 },
    ])
  })

  it('ex æquo : l’ordre de jeu (celui des joueurs) départage l’affichage', () => {
    const etat = jouer(ouverture({ playerIds: [SARAH, KEVIN, JULIEN], numbers: [3, 8, 14] }), [])

    expect(KillerRules.ranking(etat)).toEqual([
      { playerId: SARAH, rank: 1 },
      { playerId: KEVIN, rank: 1 },
      { playerId: JULIEN, rank: 1 },
    ])
  })

  it('variante : l’auto-éliminé est classé à son ordre d’élimination', () => {
    const etat = jouer(ouverture({ config: { selfHitCostsLives: true } }), [
      [Dart.double(8), Dart.triple(8)],
    ])

    expect(KillerRules.ranking(etat)).toEqual([
      { playerId: JULIEN, rank: 1 },
      { playerId: KEVIN, rank: 2 },
    ])
  })
})
