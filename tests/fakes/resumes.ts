import type {
  CheckoutPracticeSummary,
  CricketSummary,
  TourDuMondeSummary,
  X01Summary,
} from '@/core/application/ports/driving/MatchSummary'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig, type CricketVariant } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { Segment } from '@/core/domain/value-objects/Dart'
import { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { MatchName } from '@/core/domain/value-objects/MatchName'

/**
 * Des `MatchSummary` écrits à la main, pour tester le classement et l'affichage
 * sans rejouer de journal : la fonction testée ne lit que ce résumé.
 */

export const joueurId = (nom: string): PlayerId => PlayerId.of(nom.toLowerCase())

const commun = (id: string, nom: string | null, finished: boolean, winner: string | null) => ({
  id: MatchId.of(id),
  name: nom === null ? null : MatchName.of(nom),
  // `MatchName.of` rend `null` pour un nom vide : sans nom tapé.
  createdAt: new Date(2026, 9, 13, 20, 0).getTime(),
  updatedAt: new Date(2026, 9, 13, 20, 0).getTime(),
  finished,
  winnerId: winner === null ? null : joueurId(winner),
  totalVisits: 0,
})

export type JoueurX01 = {
  readonly nom: string | null
  readonly remaining: number
  readonly legsWonInSet?: number
  readonly setsWon?: number
}

export const resumeX01 = (
  joueurs: readonly JoueurX01[],
  options: {
    readonly id?: string
    readonly nom?: string | null
    readonly gagnant?: string | null
    readonly finished?: boolean
    readonly legsPlayed?: number
    readonly config?: Parameters<typeof X01Config.create>[0]
  } = {},
): X01Summary => ({
  ...commun(
    options.id ?? 'x01',
    options.nom ?? null,
    options.finished ?? options.gagnant !== undefined,
    options.gagnant ?? null,
  ),
  mode: 'X01',
  config: X01Config.create(options.config ?? {}),
  legsPlayed: options.legsPlayed ?? 0,
  players: joueurs.map((joueur) => ({
    playerId: joueurId(joueur.nom ?? 'supprime'),
    name: joueur.nom,
    remaining: joueur.remaining,
    legsWonInSet: joueur.legsWonInSet ?? 0,
    setsWon: joueur.setsWon ?? 0,
  })),
})

export type JoueurCricket = {
  readonly nom: string | null
  readonly score: number
  readonly closedTargets?: number
}

export const resumeCricket = (
  joueurs: readonly JoueurCricket[],
  options: {
    readonly id?: string
    readonly nom?: string | null
    readonly gagnant?: string | null
    readonly finished?: boolean
    readonly variant?: CricketVariant
  } = {},
): CricketSummary => ({
  ...commun(
    options.id ?? 'cricket',
    options.nom ?? null,
    options.finished ?? options.gagnant !== undefined,
    options.gagnant ?? null,
  ),
  mode: 'CRICKET',
  config: CricketConfig.create({ variant: options.variant ?? 'STANDARD' }),
  targetsTotal: 7,
  players: joueurs.map((joueur) => ({
    playerId: joueurId(joueur.nom ?? 'supprime'),
    name: joueur.nom,
    score: joueur.score,
    closedTargets: joueur.closedTargets ?? 0,
  })),
})

export type JoueurTourDuMonde = {
  readonly nom: string | null
  readonly targetIndex: number
  readonly finishedInDarts?: number | null
}

export const resumeTourDuMonde = (
  joueurs: readonly JoueurTourDuMonde[],
  options: {
    readonly id?: string
    readonly nom?: string | null
    readonly gagnant?: string | null
    readonly finished?: boolean
    readonly targets?: readonly Segment[]
  } = {},
): TourDuMondeSummary => {
  const config = TourDuMondeConfig.create(options.targets ? { targets: options.targets } : {})
  return {
    ...commun(
      options.id ?? 'monde',
      options.nom ?? null,
      options.finished ?? options.gagnant !== undefined,
      options.gagnant ?? null,
    ),
    mode: 'TOUR_DU_MONDE',
    config,
    targetsTotal: config.targets.length,
    players: joueurs.map((joueur) => ({
      playerId: joueurId(joueur.nom ?? 'supprime'),
      name: joueur.nom,
      targetIndex: joueur.targetIndex,
      finishedInDarts: joueur.finishedInDarts ?? null,
    })),
  }
}

export const resumeEntrainement = (
  options: {
    readonly id?: string
    readonly nom?: string | null
    readonly joueur?: string | null
    readonly finished?: boolean
    readonly roundsWon?: number
    readonly roundsPlayed?: number
    readonly rounds?: number
  } = {},
): CheckoutPracticeSummary => {
  const joueur = options.joueur === undefined ? 'Kevin' : options.joueur
  return {
    ...commun(options.id ?? 'solo', options.nom ?? null, options.finished ?? false, null),
    mode: 'CHECKOUT_PRACTICE',
    config: CheckoutPracticeConfig.create({ rounds: options.rounds ?? 10 }),
    players: [{ playerId: joueurId(joueur ?? 'supprime'), name: joueur }],
    roundsWon: options.roundsWon ?? 0,
    roundsPlayed: options.roundsPlayed ?? 0,
    successPercent: 0,
  }
}
