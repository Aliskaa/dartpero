import { describe, expect, it } from 'vitest'
import { computeCareerStats } from '@/core/domain/games/x01/career'
import { X01Config } from '@/core/domain/games/x01/config'
import {
  computeProgress,
  type DatedX01Stats,
  type PlayerProgress,
  TREND_SPAN,
} from '@/core/domain/games/x01/progress'
import { computeX01Stats, type X01PlayerStats } from '@/core/domain/games/x01/stats'
import { DartboardHits } from '@/core/domain/services/dartboardHits'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId, type PlayerId } from '@/core/domain/value-objects/ids'
import { JULIEN, jouer, KEVIN } from './helpers'

type Partie = {
  readonly points: number
  readonly darts: number
  readonly first9Points?: number
  readonly first9Darts?: number
  readonly highestVisit?: number
}

/** Une carte de match synthétique : seuls comptent les totaux qu'on y pose. */
const carte = (playerId: PlayerId, partie: Partie): X01PlayerStats => {
  const first9Points = partie.first9Points ?? partie.points
  const first9Darts = partie.first9Darts ?? partie.darts
  return {
    playerId,
    visits: Math.ceil(partie.darts / 3),
    dartsThrown: partie.darts,
    pointsScored: partie.points,
    average3: partie.darts === 0 ? 0 : (partie.points / partie.darts) * 3,
    first9Average: first9Darts === 0 ? 0 : (first9Points / first9Darts) * 3,
    first9Points,
    first9Darts,
    count180: 0,
    count140plus: 0,
    count100plus: 0,
    count60plus: 0,
    doubleAttempts: 0,
    doublesHit: 0,
    checkoutPercent: 0,
    bestLegDarts: null,
    highestCheckout: 0,
    highestVisit: partie.highestVisit ?? 0,
    hits: DartboardHits.empty(),
    legsWonInSet: 0,
    legsWon: 0,
    legsPlayed: 0,
    setsWon: 0,
  }
}

const partie = (
  id: string,
  createdAt: number,
  joueurs: readonly (readonly [PlayerId, Partie])[],
): DatedX01Stats => ({
  matchId: MatchId.of(id),
  createdAt,
  stats: {
    players: joueurs.map(([playerId, p]) => carte(playerId, p)),
    winnerId: null,
  },
})

/** Une partie de Kevin seul. */
const deKevin = (id: string, createdAt: number, p: Partie): DatedX01Stats =>
  partie(id, createdAt, [[KEVIN, p]])

const courbeDe = (progres: readonly PlayerProgress[], playerId: PlayerId = KEVIN) => {
  const trouvee = progres.find((courbe) => courbe.playerId === playerId)
  if (!trouvee) throw new Error(`Courbe introuvable : ${playerId}`)
  return trouvee
}

/** n parties de Kevin, la k-ième (dès 1) à 3 × k points en 3 fléchettes, à l'instant k. */
const serie = (n: number): DatedX01Stats[] =>
  Array.from({ length: n }, (_, index) =>
    deKevin(`m-${String(index + 1).padStart(3, '0')}`, index + 1, {
      points: 3 * (index + 1),
      darts: 3,
      highestVisit: 3 * (index + 1),
    }),
  )

describe('Carte Évolution — la série par partie (lot courbe)', () => {
  it('range les parties par ouverture (createdAt), quel que soit l’ordre d’entrée', () => {
    const entree = [
      deKevin('c', 300, { points: 30, darts: 3 }),
      deKevin('a', 100, { points: 10, darts: 3 }),
      deKevin('b', 200, { points: 20, darts: 3 }),
    ]

    const points = courbeDe(computeProgress(entree)).points

    expect(points.map((point) => point.matchId)).toEqual(['a', 'b', 'c'])
    expect(points.map((point) => point.number)).toEqual([1, 2, 3])
    expect(points.map((point) => point.createdAt)).toEqual([100, 200, 300])
  })

  it('départage deux ouvertures au même instant par identifiant, jamais par l’ordre d’entrée', () => {
    const a = deKevin('a', 100, { points: 10, darts: 3 })
    const b = deKevin('b', 100, { points: 20, darts: 3 })

    const dansUnSens = courbeDe(computeProgress([a, b])).points.map((point) => point.matchId)
    const dansLAutre = courbeDe(computeProgress([b, a])).points.map((point) => point.matchId)

    expect(dansUnSens).toEqual(['a', 'b'])
    expect(dansLAutre).toEqual(['a', 'b'])
  })

  it('ne donne aucun point à une partie où le joueur n’a lancé aucune fléchette', () => {
    const entree = [
      deKevin('a', 1, { points: 60, darts: 3 }),
      partie('b', 2, [
        [KEVIN, { points: 0, darts: 0 }],
        [JULIEN, { points: 45, darts: 3 }],
      ]),
      deKevin('c', 3, { points: 90, darts: 3 }),
    ]

    const progres = computeProgress(entree)
    const kevin = courbeDe(progres)

    expect(kevin.points.map((point) => point.matchId)).toEqual(['a', 'c'])
    expect(kevin.points.map((point) => point.number)).toEqual([1, 2])
    expect(courbeDe(progres, JULIEN).points).toHaveLength(1)
  })

  it('n’inscrit pas un joueur qui n’a lancé aucune fléchette sur la période', () => {
    const progres = computeProgress([
      partie('a', 1, [
        [KEVIN, { points: 60, darts: 3 }],
        [JULIEN, { points: 0, darts: 0 }],
      ]),
    ])

    expect(progres.map((courbe) => courbe.playerId)).toEqual([KEVIN])
    expect(computeProgress([])).toEqual([])
  })

  it('14 parties donnent 14 points, et la tendance part de la 3ᵉ', () => {
    const points = courbeDe(computeProgress(serie(14))).points

    expect(points).toHaveLength(14)
    expect(TREND_SPAN).toBe(3)
    expect(points[0]?.trend).toBeNull()
    expect(points[1]?.trend).toBeNull()
    expect(points[0]?.trendDelta).toBeNull()
    expect(points[1]?.trendDelta).toBeNull()
    for (const point of points.slice(2)) {
      expect(point.trend).not.toBeNull()
      expect(point.trendDelta).not.toBeNull()
    }
  })

  it('trace toutes les parties de la période : 80 parties, 80 points numérotés de 1 à 80', () => {
    const points = courbeDe(computeProgress(serie(80))).points

    expect(points).toHaveLength(80)
    expect(points.map((point) => point.number)).toEqual(
      Array.from({ length: 80 }, (_, index) => index + 1),
    )
    expect(points.at(-1)?.matchId).toBe('m-080')
  })

  it('calcule la tendance sur les 3 dernières parties seulement (N-2..N)', () => {
    const points = courbeDe(computeProgress(serie(5))).points

    expect(points[4]?.trend?.average3).toBeCloseTo(12, 10)
    expect(points[2]?.trend?.average3).toBeCloseTo(6, 10)
  })

  it('recalcule la tendance depuis les totaux, jamais en moyennant des moyennes', () => {
    const entree = [
      deKevin('a', 1, { points: 180, darts: 3 }),
      deKevin('b', 2, { points: 0, darts: 3 }),
      deKevin('c', 3, { points: 300, darts: 30 }),
    ]

    const points = courbeDe(computeProgress(entree)).points

    expect(points.map((point) => point.value.average3)).toEqual([180, 0, 30])
    expect(points[2]?.trend?.average3).toBeCloseTo(40, 10)
    expect(points[2]?.trend?.average3).not.toBeCloseTo(70, 1)
  })

  it('pondère aussi le First 9 par ses fléchettes', () => {
    const entree = [
      deKevin('a', 1, { points: 180, darts: 3, first9Points: 180, first9Darts: 3 }),
      deKevin('b', 2, { points: 0, darts: 3, first9Points: 0, first9Darts: 3 }),
      deKevin('c', 3, { points: 300, darts: 30, first9Points: 90, first9Darts: 9 }),
    ]

    const tendance = courbeDe(computeProgress(entree)).points[2]?.trend

    expect(tendance?.first9Average).toBeCloseTo(54, 10)
  })

  it('⚠️ fait la moyenne arithmétique des 3 meilleures volées (décision U3 a) : 60, 140, 100 → 100', () => {
    const entree = [
      deKevin('a', 1, { points: 60, darts: 3, highestVisit: 60 }),
      deKevin('b', 2, { points: 140, darts: 3, highestVisit: 140 }),
      deKevin('c', 3, { points: 100, darts: 3, highestVisit: 100 }),
    ]

    const tendance = courbeDe(computeProgress(entree)).points[2]?.trend

    expect(tendance?.highestVisit).toBe(100)
  })

  it('⚠️ Meilleure volée, série non croissante : la tendance et l’écart sont des moyennes, jamais des maximums', () => {
    const entree = [60, 140, 100, 180, 60].map((volee, rang) =>
      deKevin(`v${rang}`, rang + 1, { points: volee, darts: 3, highestVisit: volee }),
    )

    const points = courbeDe(computeProgress(entree)).points

    expect(points[2]?.trend?.highestVisit).toBeCloseTo(100, 10)
    expect(points[3]?.trend?.highestVisit).toBeCloseTo(140, 10)
    expect(points[4]?.trend?.highestVisit).toBeCloseTo(340 / 3, 10)
    expect(points[4]?.trendDelta?.highestVisit).toBeCloseTo(40 / 3, 10)
    expect(points[4]?.trendDelta?.highestVisit).not.toBeCloseTo(40, 1)
  })

  it('mesure l’écart depuis la tendance au rang 3, même à 80 parties', () => {
    const points = courbeDe(computeProgress(serie(80))).points

    expect(points[2]?.trendDelta?.average3).toBeCloseTo(0, 10)
    expect(points[79]?.trend?.average3).toBeCloseTo(237, 10)
    expect(points[79]?.trendDelta?.average3).toBeCloseTo(231, 10)
    expect(points[79]?.trendDelta?.highestVisit).toBeCloseTo(237 - 6, 10)
  })

  it('donne en référence la moyenne de toute la période, celle du cumul', () => {
    const entree = [
      partie('a', 1, [
        [KEVIN, { points: 180, darts: 3, first9Points: 180, first9Darts: 3 }],
        [JULIEN, { points: 45, darts: 3 }],
      ]),
      deKevin('b', 2, { points: 0, darts: 3, first9Points: 0, first9Darts: 3 }),
      deKevin('c', 3, { points: 300, darts: 30, first9Points: 90, first9Darts: 9 }),
      deKevin('d', 4, { points: 26, darts: 6, first9Points: 26, first9Darts: 6 }),
    ]

    const cumul = computeCareerStats(entree.map((match) => match.stats)).find(
      (joueur) => joueur.playerId === KEVIN,
    )
    const reference = courbeDe(computeProgress(entree)).reference

    expect(reference.average3).toBe(cumul?.average3)
    expect(reference.first9Average).toBe(cumul?.first9Average)
  })

  it('reprend les mesures d’une vraie partie telles que les calcule le résumé', () => {
    const stats = computeX01Stats(
      jouer(
        X01Config.create({ startingScore: 501, legsToWin: 1 }),
        [KEVIN, JULIEN],
        [
          [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
          [Dart.single(5), Dart.single(1), Dart.miss()],
          [Dart.single(20), Dart.single(19), Dart.single(18)],
        ],
      ),
    )

    const progres = computeProgress([{ matchId: MatchId.of('vraie'), createdAt: 1, stats }])
    const point = courbeDe(progres).points[0]
    const carteKevin = stats.players.find((joueur) => joueur.playerId === KEVIN)

    expect(point?.value).toEqual({
      average3: carteKevin?.average3,
      first9Average: carteKevin?.first9Average,
      highestVisit: 180,
    })
    expect(point?.value.average3).toBeCloseTo((237 / 6) * 3, 10)
  })
})
