import { describe, expect, it } from 'vitest'
import { X01Config } from '@/core/domain/entities/Match'
import { computeMatchStats, type PlayerStats } from '@/core/domain/services/matchStats'
import type { MatchState } from '@/core/domain/services/x01Rules'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { JULIEN, jouer, KEVIN } from './helpers'

const T20 = Dart.triple(20)
const T19 = Dart.triple(19)
const S20 = Dart.single(20)
const S1 = Dart.single(1)
const D20 = Dart.double(20)
const D12 = Dart.double(12)

const stats = (state: MatchState, playerId: PlayerId): PlayerStats => {
  const found = computeMatchStats(state).players.find((p) => p.playerId === playerId)
  if (!found) throw new Error(`Stats introuvables pour ${playerId}`)
  return found
}

/** Un leg de 501 gagné par Kevin en 9 fléchettes (180, 180, 141). */
const legParfait = (): MatchState =>
  jouer(
    X01Config.create({ legsToWin: 3 }),
    [KEVIN, JULIEN],
    [
      [T20, T20, T20],
      [S1, S1, S1],
      [T20, T20, T20],
      [S1, S1, S1],
      [T20, T19, D12],
    ],
  )

describe('computeMatchStats', () => {
  it('calcule la moyenne 3 fléchettes', () => {
    const kevin = stats(legParfait(), KEVIN)

    expect(kevin.dartsThrown).toBe(9)
    expect(kevin.pointsScored).toBe(501)
    expect(kevin.average3).toBeCloseTo(167, 5)
  })

  it('compte les paliers de volée de façon cumulative', () => {
    const kevin = stats(legParfait(), KEVIN)

    expect(kevin.count180).toBe(2)
    expect(kevin.count140plus).toBe(3) // les deux 180 comptent aussi ici
    expect(kevin.count100plus).toBe(3)
    expect(kevin.count60plus).toBe(3)
    expect(kevin.highestVisit).toBe(180)
  })

  it('retient le meilleur leg et le plus haut checkout', () => {
    const kevin = stats(legParfait(), KEVIN)
    const julien = stats(legParfait(), JULIEN)

    expect(kevin.bestLegDarts).toBe(9)
    expect(kevin.highestCheckout).toBe(141)
    expect(julien.bestLegDarts).toBeNull()
    expect(julien.highestCheckout).toBe(0)
  })

  it('calcule aussi les stats du joueur qui perd', () => {
    const julien = stats(legParfait(), JULIEN)

    expect(julien.dartsThrown).toBe(6)
    expect(julien.pointsScored).toBe(6)
    expect(julien.average3).toBeCloseTo(3, 5)
    expect(julien.count60plus).toBe(0)
  })

  it('compte les fléchettes d’une volée busted, mais aucun point', () => {
    const state = jouer(
      X01Config.create({ startingScore: 100 }),
      [KEVIN],
      [
        [T20, T20], // bust : 100 → 40 → -20
        [T20], // 100 → 40
      ],
    )
    const kevin = stats(state, KEVIN)

    expect(kevin.dartsThrown).toBe(3)
    expect(kevin.pointsScored).toBe(60)
    expect(kevin.average3).toBeCloseTo(60, 5)
  })

  it('limite la moyenne « first 9 » aux 3 premières volées du leg', () => {
    const state = jouer(
      X01Config.create(),
      [KEVIN],
      [
        [T20, T20, T20], // 180
        [T20, T20, T20], // 180
        [S20, S20, S20], // 60
        [S20, S20, S20], // 60 — hors des 9 premières fléchettes
      ],
    )
    const kevin = stats(state, KEVIN)

    expect(kevin.first9Average).toBeCloseTo(140, 5) // (180 + 180 + 60) / 9 × 3
    expect(kevin.average3).toBeCloseTo(120, 5) // 480 / 12 × 3
  })

  it('compte les tentatives de double et le taux de réussite', () => {
    const state = jouer(
      X01Config.create({ startingScore: 40 }),
      [KEVIN],
      [
        [S20, S20], // depuis 40 puis 20 : 2 tentatives, puis bust sur un simple
        [D20], // depuis 40 : 1 tentative, réussie
      ],
    )
    const kevin = stats(state, KEVIN)

    expect(kevin.doubleAttempts).toBe(3)
    expect(kevin.doublesHit).toBe(1)
    expect(kevin.checkoutPercent).toBeCloseTo(33.333, 2)
  })

  it('renvoie des stats neutres pour un match sans aucune volée', () => {
    const state = jouer(X01Config.create(), [KEVIN, JULIEN], [])
    const kevin = stats(state, KEVIN)

    expect(kevin.visits).toBe(0)
    expect(kevin.average3).toBe(0)
    expect(kevin.first9Average).toBe(0)
    expect(kevin.checkoutPercent).toBe(0)
    expect(kevin.bestLegDarts).toBeNull()
  })

  it('reporte le vainqueur du match', () => {
    const state = jouer(
      X01Config.create({ startingScore: 40, legsToWin: 1 }),
      [KEVIN, JULIEN],
      [[D20]],
    )

    expect(computeMatchStats(state).winnerId).toBe(KEVIN)
  })
})
