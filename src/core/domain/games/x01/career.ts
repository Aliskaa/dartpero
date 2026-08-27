import { DartboardHits } from '../../services/dartboardHits'
import type { PlayerId } from '../../value-objects/ids'
import type { X01PlayerStats, X01Stats } from './stats'

/**
 * Ce qu'un joueur a accompli sur **toutes** ses parties.
 *
 * ⚠️ Les moyennes sont recalculées depuis les totaux bruts, jamais moyennées
 * entre elles : la moyenne des moyennes est fausse dès que les parties n'ont
 * pas la même longueur — et elles n'en ont jamais.
 */
export type CareerStats = {
  readonly playerId: PlayerId
  readonly matchesPlayed: number
  readonly matchesWon: number
  /** En pourcentage (0-100). 0 si aucune partie. */
  readonly matchWinPercent: number
  readonly legsWon: number
  /**
   * Legs terminés auxquels le joueur a participé — le dénominateur qui manquait.
   * « 12 legs gagnés » ne dit rien sans lui : sur 14, c'est une razzia ; sur 40,
   * c'est une saison difficile.
   */
  readonly legsPlayed: number
  /** En pourcentage (0-100). 0 si aucun leg terminé. */
  readonly legWinPercent: number
  readonly visits: number
  readonly dartsThrown: number
  readonly pointsScored: number
  readonly average3: number
  readonly first9Average: number
  readonly count180: number
  readonly count140plus: number
  readonly count100plus: number
  readonly count60plus: number
  readonly doubleAttempts: number
  readonly doublesHit: number
  readonly checkoutPercent: number
  readonly bestLegDarts: number | null
  readonly highestCheckout: number
  readonly highestVisit: number
  /** Où ses fléchettes se sont plantées, toutes parties cumulées. */
  readonly hits: DartboardHits
}

type Accumulator = {
  matchesPlayed: number
  matchesWon: number
  legsWon: number
  legsPlayed: number
  visits: number
  dartsThrown: number
  pointsScored: number
  first9Points: number
  first9Darts: number
  count180: number
  count140plus: number
  count100plus: number
  count60plus: number
  doubleAttempts: number
  doublesHit: number
  bestLegDarts: number | null
  highestCheckout: number
  highestVisit: number
  hits: DartboardHits
}

const nouvelAccumulateur = (): Accumulator => ({
  matchesPlayed: 0,
  matchesWon: 0,
  legsWon: 0,
  legsPlayed: 0,
  visits: 0,
  dartsThrown: 0,
  pointsScored: 0,
  first9Points: 0,
  first9Darts: 0,
  count180: 0,
  count140plus: 0,
  count100plus: 0,
  count60plus: 0,
  doubleAttempts: 0,
  doublesHit: 0,
  bestLegDarts: null,
  highestCheckout: 0,
  highestVisit: 0,
  hits: DartboardHits.empty(),
})

const moyenne = (points: number, darts: number): number => (darts === 0 ? 0 : (points / darts) * 3)

/**
 * Un ratio en pourcentage, brut — l'UI arrondit.
 *
 * ⚠️ Comme les moyennes, il se recalcule depuis les **totaux bruts** : moyenner
 * les pourcentages de chaque partie serait faux dès qu'elles n'ont pas la même
 * longueur, et elles n'en ont jamais.
 */
const pourcentage = (reussis: number, total: number): number =>
  total === 0 ? 0 : (reussis / total) * 100

const plusCourt = (actuel: number | null, candidat: number | null): number | null => {
  if (candidat === null) return actuel
  if (actuel === null) return candidat
  return Math.min(actuel, candidat)
}

const cumuler = (acc: Accumulator, joueur: X01PlayerStats, gagnant: boolean): void => {
  acc.matchesPlayed += 1
  if (gagnant) acc.matchesWon += 1
  acc.legsWon += joueur.legsWon
  acc.legsPlayed += joueur.legsPlayed
  acc.visits += joueur.visits
  acc.dartsThrown += joueur.dartsThrown
  acc.pointsScored += joueur.pointsScored
  acc.first9Points += joueur.first9Points
  acc.first9Darts += joueur.first9Darts
  acc.count180 += joueur.count180
  acc.count140plus += joueur.count140plus
  acc.count100plus += joueur.count100plus
  acc.count60plus += joueur.count60plus
  acc.doubleAttempts += joueur.doubleAttempts
  acc.doublesHit += joueur.doublesHit
  acc.bestLegDarts = plusCourt(acc.bestLegDarts, joueur.bestLegDarts)
  acc.highestCheckout = Math.max(acc.highestCheckout, joueur.highestCheckout)
  acc.highestVisit = Math.max(acc.highestVisit, joueur.highestVisit)
  // La carrière ADDITIONNE les cartes de chaque match ; elle ne relit jamais
  // les fléchettes de la base. Une seule façon de compter, donc aucune chance
  // que le résumé d'une partie et le cumul se contredisent.
  acc.hits = DartboardHits.merge(acc.hits, joueur.hits)
}

/**
 * Agrège les statistiques de plusieurs parties, joueur par joueur.
 *
 * Une partie **en cours** compte comme les autres : ses fléchettes ont bien été
 * lancées, et attendre la fin d'un leg pour voir sa moyenne bouger serait
 * frustrant. Seul `matchesWon` distingue les parties terminées, puisqu'un match
 * sans vainqueur n'en a tout simplement pas.
 */
export const computeCareerStats = (matches: readonly X01Stats[]): readonly CareerStats[] => {
  const accumulateurs = new Map<PlayerId, Accumulator>()

  for (const match of matches) {
    for (const joueur of match.players) {
      const acc = accumulateurs.get(joueur.playerId) ?? nouvelAccumulateur()
      cumuler(acc, joueur, match.winnerId === joueur.playerId)
      accumulateurs.set(joueur.playerId, acc)
    }
  }

  return [...accumulateurs].map(([playerId, acc]) => ({
    playerId,
    matchesPlayed: acc.matchesPlayed,
    matchesWon: acc.matchesWon,
    matchWinPercent: pourcentage(acc.matchesWon, acc.matchesPlayed),
    legsWon: acc.legsWon,
    legsPlayed: acc.legsPlayed,
    legWinPercent: pourcentage(acc.legsWon, acc.legsPlayed),
    visits: acc.visits,
    dartsThrown: acc.dartsThrown,
    pointsScored: acc.pointsScored,
    average3: moyenne(acc.pointsScored, acc.dartsThrown),
    first9Average: moyenne(acc.first9Points, acc.first9Darts),
    count180: acc.count180,
    count140plus: acc.count140plus,
    count100plus: acc.count100plus,
    count60plus: acc.count60plus,
    doubleAttempts: acc.doubleAttempts,
    doublesHit: acc.doublesHit,
    checkoutPercent: acc.doubleAttempts === 0 ? 0 : (acc.doublesHit / acc.doubleAttempts) * 100,
    bestLegDarts: acc.bestLegDarts,
    highestCheckout: acc.highestCheckout,
    highestVisit: acc.highestVisit,
    hits: acc.hits,
  }))
}
