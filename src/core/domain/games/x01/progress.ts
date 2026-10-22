import type { MatchId, PlayerId } from '../../value-objects/ids'
import { computeCareerStats } from './career'
import type { X01PlayerStats, X01Stats } from './stats'

/**
 * Les statistiques d'une partie X01, datées de son **ouverture**.
 *
 * ⚠️ `createdAt`, jamais `updatedAt` : une partie appartient à la soirée où elle
 * a commencé, comme pour le filtre de période des statistiques.
 */
export type DatedX01Stats = {
  readonly matchId: MatchId
  readonly createdAt: number
  readonly stats: X01Stats
}

/** Les trois mesures de la carte Évolution, brutes : l'UI arrondit. */
export type ProgressMeasures = {
  readonly average3: number
  readonly first9Average: number
  readonly highestVisit: number
}

/** Une partie de la courbe d'un joueur. */
export type ProgressPoint = {
  readonly matchId: MatchId
  readonly createdAt: number
  /** Rang vrai de la partie dans la période, dès 1 (« Partie N sur M »). */
  readonly number: number
  /** Les mesures de cette seule partie. */
  readonly value: ProgressMeasures
  /** Tendance sur les `TREND_SPAN` dernières parties ; `null` avant la 3ᵉ. */
  readonly trend: ProgressMeasures | null
  /** Tendance de ce point moins la tendance au rang 3 ; `null` avant la 3ᵉ. */
  readonly trendDelta: ProgressMeasures | null
}

/** La courbe d'un joueur sur une période, de la partie la plus ancienne à la plus récente. */
export type PlayerProgress = {
  readonly playerId: PlayerId
  readonly points: readonly ProgressPoint[]
  /**
   * La moyenne de toute la période (la ligne pointillée) : `computeCareerStats`,
   * donc exactement ce qu'affiche le podium pour la même période.
   */
  readonly reference: {
    readonly average3: number
    readonly first9Average: number
  }
}

/** Le nombre de parties sur lesquelles la tendance se calcule. */
export const TREND_SPAN = 3

type Partie = {
  readonly matchId: MatchId
  readonly createdAt: number
  readonly joueur: X01PlayerStats
}

/**
 * Tri **explicite** : le dépôt rend les parties par dernière modification,
 * jamais par ouverture. À ouverture égale, l'identifiant départage, pour que
 * l'ordre ne dépende jamais de celui de l'entrée.
 */
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
 * La tendance d'une fenêtre de parties.
 *
 * Moyenne et First 9 passent par `computeCareerStats`, la fonction du podium :
 * Σ points ÷ Σ fléchettes × 3, **jamais** une moyenne des moyennes, fausse dès
 * que les parties n'ont pas la même longueur.
 *
 * ⚠️ Meilleure volée est la **seule** moyenne arithmétique de la série : la
 * moyenne des trois meilleures volées de la fenêtre (décision de l'utilisateur,
 * lot `courbe`, U3 a). Un record ne se « recalcule » pas depuis des totaux ; le
 * maximum des trois aurait été une autre mesure, écartée.
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
  // ⚠️ La base de l'écart est la tendance au rang 3 — les trois premières
  // parties de la période — quelle que soit la longueur de la courbe.
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

/**
 * La courbe de chaque joueur sur les parties fournies (celles de la période).
 *
 * - Les parties sont rangées par `createdAt` croissant, puis par identifiant.
 * - ⚠️ Un point par partie où le joueur a lancé **au moins une fléchette** :
 *   une volée compte de 1 à 3 fléchettes, donc un point a toujours ses trois
 *   mesures (jamais « — »). Une partie sans fléchette du joueur ne donne pas de
 *   point — mais elle ne change rien au cumul, qui la compte pour zéro.
 * - Les parties en cours et abandonnées comptent, comme dans le cumul : le
 *   dernier point d'une période d'une partie est la carte Moyenne du podium.
 * - Un joueur sans aucun point n'apparaît pas.
 *
 * Rien n'est stocké : tout se recalcule depuis les journaux.
 */
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
