import { Dart } from '../value-objects/Dart'
import type { PlayerId } from '../value-objects/ids'
import { isOnACheckoutDouble } from './checkout'
import type { MatchState } from './x01Rules'

export type PlayerStats = {
  readonly playerId: PlayerId
  readonly visits: number
  readonly dartsThrown: number
  readonly pointsScored: number
  /** Moyenne 3 fléchettes : (points ÷ fléchettes) × 3. Brute, l'UI arrondit. */
  readonly average3: number
  /** Moyenne sur les 3 premières volées de chaque leg (les « 9 premières fléchettes »). */
  readonly first9Average: number
  readonly count180: number
  /** Cumulatif : un 180 compte aussi dans les 140+, les 100+ et les 60+. */
  readonly count140plus: number
  readonly count100plus: number
  readonly count60plus: number
  readonly doubleAttempts: number
  readonly doublesHit: number
  /** En pourcentage (0-100). 0 si aucune tentative. */
  readonly checkoutPercent: number
  /** Plus petit nombre de fléchettes pour gagner un leg. `null` si aucun leg gagné. */
  readonly bestLegDarts: number | null
  readonly highestCheckout: number
  readonly highestVisit: number
  readonly legsWonInSet: number
  readonly setsWon: number
}

export type MatchStats = {
  readonly players: readonly PlayerStats[]
  readonly winnerId: PlayerId | null
}

type Accumulator = {
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
  highestCheckout: number
  highestVisit: number
  /** Nombre de volées déjà comptées par leg, pour isoler les 9 premières fléchettes. */
  visitsParLeg: Map<number, number>
}

const nouvelAccumulateur = (): Accumulator => ({
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
  highestCheckout: 0,
  highestVisit: 0,
  visitsParLeg: new Map(),
})

const moyenne = (points: number, darts: number): number => (darts === 0 ? 0 : (points / darts) * 3)

/**
 * Toutes les statistiques d'un match, dérivées de l'historique projeté.
 *
 * ⚠️ Une volée *busted* marque 0 point mais ses fléchettes sont comptées :
 * c'est la définition standard de la moyenne 3 fléchettes.
 */
export const computeMatchStats = (state: MatchState): MatchStats => {
  const accumulateurs = new Map<PlayerId, Accumulator>(
    state.players.map((player) => [player.playerId, nouvelAccumulateur()]),
  )

  for (const visit of state.history) {
    const acc = accumulateurs.get(visit.playerId)
    if (!acc) continue

    acc.visits += 1
    acc.dartsThrown += visit.darts.length
    acc.pointsScored += visit.scored
    acc.highestVisit = Math.max(acc.highestVisit, visit.scored)

    if (visit.scored >= 180) acc.count180 += 1
    if (visit.scored >= 140) acc.count140plus += 1
    if (visit.scored >= 100) acc.count100plus += 1
    if (visit.scored >= 60) acc.count60plus += 1

    // Les 9 premières fléchettes du leg ≈ les 3 premières volées.
    const dejaComptees = acc.visitsParLeg.get(visit.legNumber) ?? 0
    if (dejaComptees < 3) {
      acc.first9Points += visit.scored
      acc.first9Darts += visit.darts.length
    }
    acc.visitsParLeg.set(visit.legNumber, dejaComptees + 1)

    // Tentatives de double : chaque fléchette lancée depuis un reste qu'une
    // seule fléchette peut clore.
    let reste: number = visit.remainingBefore
    for (const dart of visit.darts) {
      if (isOnACheckoutDouble(reste, state.config)) acc.doubleAttempts += 1
      reste -= Dart.points(dart)
    }

    if (visit.outcome === 'CHECKOUT') {
      acc.doublesHit += 1
      acc.highestCheckout = Math.max(acc.highestCheckout, visit.remainingBefore)
    }
  }

  const meilleurLeg = new Map<PlayerId, number>()
  for (const milestone of state.milestones) {
    if (milestone.type !== 'LegWon') continue
    const actuel = meilleurLeg.get(milestone.playerId)
    if (actuel === undefined || milestone.dartsUsed < actuel) {
      meilleurLeg.set(milestone.playerId, milestone.dartsUsed)
    }
  }

  return {
    winnerId: state.winnerId,
    players: state.players.map((player) => {
      const acc = accumulateurs.get(player.playerId) ?? nouvelAccumulateur()
      return {
        playerId: player.playerId,
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
        bestLegDarts: meilleurLeg.get(player.playerId) ?? null,
        highestCheckout: acc.highestCheckout,
        highestVisit: acc.highestVisit,
        legsWonInSet: player.legsWonInSet,
        setsWon: player.setsWon,
      }
    }),
  }
}
