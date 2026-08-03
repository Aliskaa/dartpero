import { describe, expect, it } from 'vitest'
import { computeCareerStats } from '@/core/domain/games/x01/career'
import { X01Config } from '@/core/domain/games/x01/config'
import { computeX01Stats } from '@/core/domain/games/x01/stats'
import { Dart } from '@/core/domain/value-objects/Dart'
import { JULIEN, jouer, KEVIN } from './helpers'

const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
const RIEN = [Dart.miss(), Dart.miss(), Dart.miss()]

/** Une partie de 501 gagnée par Kevin en 9 fléchettes, Julien n'ayant rien marqué. */
const legParfait = () =>
  computeX01Stats(
    jouer(
      X01Config.create({ startingScore: 501, legsToWin: 1 }),
      [KEVIN, JULIEN],
      [T20, RIEN, T20, RIEN, [Dart.triple(20), Dart.triple(19), Dart.double(12)]],
    ),
  )

/** Une partie où Kevin ne fait que des simples 20 — et ne gagne pas. */
const legMediocre = () =>
  computeX01Stats(
    jouer(
      X01Config.create({ startingScore: 501, legsToWin: 1 }),
      [KEVIN, JULIEN],
      [[Dart.single(20), Dart.single(20), Dart.single(20)], RIEN],
    ),
  )

const carriereDe = (...matchs: ReturnType<typeof computeX01Stats>[]) => {
  const carriere = computeCareerStats(matchs).find((joueur) => joueur.playerId === KEVIN)
  if (!carriere) throw new Error('Carrière de Kevin introuvable')
  return carriere
}

describe('Statistiques de carrière', () => {
  it('additionne les compteurs de toutes les parties', () => {
    const kevin = carriereDe(legParfait(), legMediocre())

    expect(kevin.matchesPlayed).toBe(2)
    expect(kevin.matchesWon).toBe(1)
    expect(kevin.legsWon).toBe(1)
    // 9 fléchettes du leg parfait + 3 de la partie médiocre.
    expect(kevin.dartsThrown).toBe(12)
    expect(kevin.pointsScored).toBe(501 + 60)
    expect(kevin.count180).toBe(2)
    expect(kevin.count60plus).toBe(4)
  })

  /**
   * Le piège classique de l'agrégation : moyenner des moyennes. Ici 167 et 60
   * donneraient 113,5 — la vraie valeur est 561 points ÷ 12 fléchettes × 3.
   */
  it('recalcule les moyennes depuis les totaux, sans moyenner des moyennes', () => {
    const kevin = carriereDe(legParfait(), legMediocre())

    expect(kevin.average3).toBeCloseTo((561 / 12) * 3, 5)
    expect(kevin.average3).not.toBeCloseTo((167 + 60) / 2, 1)
  })

  it('garde le meilleur de chaque record, jamais le dernier', () => {
    const kevin = carriereDe(legMediocre(), legParfait())

    expect(kevin.bestLegDarts).toBe(9)
    expect(kevin.highestCheckout).toBe(141)
    expect(kevin.highestVisit).toBe(180)
  })

  it('ignore un record absent plutôt que de le compter comme zéro', () => {
    // Julien n'a gagné aucun leg : son meilleur leg n'existe pas, il ne vaut
    // pas « 0 fléchette », ce qui le placerait premier au classement.
    const julien = computeCareerStats([legParfait(), legMediocre()]).find(
      (joueur) => joueur.playerId === JULIEN,
    )

    expect(julien?.bestLegDarts).toBeNull()
    expect(julien?.matchesWon).toBe(0)
  })

  it('ne compte que les joueurs ayant réellement joué', () => {
    expect(computeCareerStats([])).toEqual([])
    expect(computeCareerStats([legParfait()]).map((joueur) => joueur.playerId)).toEqual([
      KEVIN,
      JULIEN,
    ])
  })

  it('cumule les tentatives de double sur l’ensemble des parties', () => {
    const kevin = carriereDe(legParfait(), legParfait())

    expect(kevin.doublesHit).toBe(2)
    expect(kevin.doubleAttempts).toBeGreaterThanOrEqual(2)
    expect(kevin.checkoutPercent).toBeCloseTo((kevin.doublesHit / kevin.doubleAttempts) * 100, 5)
  })
})
