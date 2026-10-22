import type { MatchId, PlayerId } from '../../value-objects/ids'
import { computeCareerStats } from './career'
import type { X01PlayerStats, X01Stats } from './stats'

/** ⚠️ Datée de son ouverture (`createdAt`, jamais `updatedAt`), comme le filtre de période. */
export type DatedX01Stats = {
  readonly matchId: MatchId
  readonly createdAt: number
  readonly stats: X01Stats
}

/** Mesures brutes : l'UI arrondit. */
export type ProgressMeasures = {
  readonly average3: number
  readonly first9Average: number
  readonly highestVisit: number
}

export type ProgressPoint = {
  readonly matchId: MatchId
  readonly createdAt: number
  /** Rang vrai dans la période, dès 1. */
  readonly number: number
  readonly value: ProgressMeasures
  /** Tendance sur les `TREND_SPAN` dernières parties ; `null` avant la 3ᵉ. */
  readonly trend: ProgressMeasures | null
  /** Tendance moins la tendance au rang 3 ; `null` avant la 3ᵉ. */
  readonly trendDelta: ProgressMeasures | null
}

export type PlayerProgress = {
  readonly playerId: PlayerId
  readonly points: readonly ProgressPoint[]
  /** Moyenne de la période, comme le podium (`computeCareerStats`). */
  readonly reference: {
    readonly average3: number
    readonly first9Average: number
  }
}

export const TREND_SPAN = 3

type Partie = {
  readonly matchId: MatchId
  readonly createdAt: number
  readonly joueur: X01PlayerStats
}

// Le dépôt trie par dernière modification : tri explicite par ouverture, puis identifiant.
const parOuverture = (a: DatedX01Stats, b: DatedX01Stats): number => {
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt
  if (a.matchId < b.matchId) return -1
  if (a.matchId > b.matchId) return 1
  return 0
}

const mesuresDe = (joueur: X01PlayerStats): ProgressMeasures => ({
  average3: joueur.average3,
  first9Average: joueur.first9Average,
  highestVisit: joueur.highestVisit,
})

/**
 * Moyenne et First 9 depuis les totaux (`computeCareerStats`), jamais une moyenne de moyennes.
 * ⚠️ Meilleure volée : seule moyenne arithmétique, celle des meilleures volées de la fenêtre.
 */
const tendanceDe = (fenetre: readonly Partie[]): ProgressMeasures => {
  const [cumul] = computeCareerStats(
    fenetre.map((partie) => ({ players: [partie.joueur], winnerId: null })),
  )
  const sommeVolees = fenetre.reduce((somme, partie) => somme + partie.joueur.highestVisit, 0)
  return {
    average3: cumul?.average3 ?? 0,
    first9Average: cumul?.first9Average ?? 0,
    highestVisit: sommeVolees / fenetre.length,
  }
}

const ecart = (a: ProgressMeasures, b: ProgressMeasures): ProgressMeasures => ({
  average3: a.average3 - b.average3,
  first9Average: a.first9Average - b.first9Average,
  highestVisit: a.highestVisit - b.highestVisit,
})

const courbeDe = (parties: readonly Partie[]): readonly ProgressPoint[] => {
  const tendances = parties.map((_, index) =>
    index + 1 < TREND_SPAN ? null : tendanceDe(parties.slice(index + 1 - TREND_SPAN, index + 1)),
  )
  // ⚠️ La base de l'écart est la tendance au rang 3, quelle que soit la longueur de la courbe.
  const base = tendances[TREND_SPAN - 1] ?? null

  return parties.map((partie, index) => {
    const trend = tendances[index] ?? null
    return {
      matchId: partie.matchId,
      createdAt: partie.createdAt,
      number: index + 1,
      value: mesuresDe(partie.joueur),
      trend,
      trendDelta: trend === null || base === null ? null : ecart(trend, base),
    }
  })
}

/** ⚠️ Un point par partie où le joueur a lancé au moins une fléchette ; parties en cours comprises, comme le cumul. */
export const computeProgress = (matches: readonly DatedX01Stats[]): readonly PlayerProgress[] => {
  const rangees = [...matches].sort(parOuverture)
  const references = new Map(
    computeCareerStats(rangees.map((match) => match.stats)).map((cumul) => [cumul.playerId, cumul]),
  )

  const partiesParJoueur = new Map<PlayerId, Partie[]>()
  for (const match of rangees) {
    for (const joueur of match.stats.players) {
      if (joueur.dartsThrown === 0) continue
      const parties = partiesParJoueur.get(joueur.playerId) ?? []
      parties.push({ matchId: match.matchId, createdAt: match.createdAt, joueur })
      partiesParJoueur.set(joueur.playerId, parties)
    }
  }

  return [...partiesParJoueur].map(([playerId, parties]) => {
    const cumul = references.get(playerId)
    return {
      playerId,
      points: courbeDe(parties),
      reference: {
        average3: cumul?.average3 ?? 0,
        first9Average: cumul?.first9Average ?? 0,
      },
    }
  })
}
