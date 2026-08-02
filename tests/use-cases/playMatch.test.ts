import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/entities/Match'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const T20 = Dart.triple(20)
const T19 = Dart.triple(19)
const S1 = Dart.single(1)
const D12 = Dart.double(12)

/** Un leg de 501 en 9 fléchettes : 180, 180, puis sortie sur 141. */
const NEUF_FLECHETTES = [
  [T20, T20, T20],
  [T20, T20, T20],
  [T20, T19, D12],
] as const

/** Une volée qui ne menace personne. */
const PETITE = [S1, S1, S1]

describe('Partie complète de 501 en best-of 3, via les use cases', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId
  let matchId: MatchId

  beforeEach(async () => {
    services = fakeServices().services

    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id

    matchId = await services.startMatch.execute({
      playerIds: [kevin, julien],
      config: X01Config.create(), // 501, premier à 2 legs, double out
    })
  })

  const volee = (darts: readonly Dart[]) => services.recordVisit.execute({ matchId, darts })

  it('joue le match de bout en bout et le persiste', async () => {
    // --- Leg 0 : Kevin commence et sort en 9 fléchettes ---
    await volee(NEUF_FLECHETTES[0])
    await volee(PETITE)
    await volee(NEUF_FLECHETTES[1])
    await volee(PETITE)
    const leg0 = await volee(NEUF_FLECHETTES[2])

    expect(leg0.visit.outcome).toBe('CHECKOUT')
    expect(leg0.milestones).toEqual([
      { type: 'LegWon', playerId: kevin, legNumber: 0, dartsUsed: 9 },
    ])

    // --- Leg 1 : c'est au tour de Julien de commencer ---
    await volee(PETITE)
    await volee(NEUF_FLECHETTES[0])
    await volee(PETITE)
    await volee(NEUF_FLECHETTES[1])
    await volee(PETITE)
    const fin = await volee(NEUF_FLECHETTES[2])

    expect(fin.state.winnerId).toBe(kevin)
    expect(fin.milestones.map((m) => m.type)).toEqual(['LegWon', 'SetWon', 'MatchFinished'])

    // --- Le match est bien retrouvé tel quel depuis le dépôt ---
    const relu = await services.getMatchState.execute(matchId)
    expect(relu.winnerId).toBe(kevin)
    expect(relu.history).toHaveLength(11)
  })

  it('calcule les statistiques du match rejoué', async () => {
    for (const darts of [
      NEUF_FLECHETTES[0],
      PETITE,
      NEUF_FLECHETTES[1],
      PETITE,
      NEUF_FLECHETTES[2],
    ]) {
      await volee(darts)
    }

    const stats = await services.getMatchStats.execute(matchId)
    const statsKevin = stats.players.find((p) => p.playerId === kevin)

    expect(statsKevin?.average3).toBeCloseTo(167, 5)
    expect(statsKevin?.bestLegDarts).toBe(9)
    expect(statsKevin?.highestCheckout).toBe(141)
    expect(statsKevin?.count180).toBe(2)
  })

  it('propose une sortie au joueur en cours', async () => {
    await volee(NEUF_FLECHETTES[0])
    await volee(PETITE)
    await volee(NEUF_FLECHETTES[1])

    const etat = await services.getMatchState.execute(matchId)
    const suggestion = services.getCheckoutSuggestion.execute({
      remaining: 141,
      dartsLeft: 3,
      config: etat.config,
    })

    // Le contrat est « une route valide », pas « la route de la table PDC ».
    expect(suggestion).not.toBeNull()
    expect(suggestion?.length).toBeLessThanOrEqual(3)
    expect(suggestion?.reduce((somme, dart) => somme + Dart.points(dart), 0)).toBe(141)
    expect(suggestion && Dart.isDouble(suggestion[suggestion.length - 1] ?? Dart.miss())).toBe(true)
  })
})
