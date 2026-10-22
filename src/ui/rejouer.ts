import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { KILLER_MIN_PLAYERS } from '@/core/domain/games/killer/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import {
  JOUEURS_ENTRAINEMENT,
  JOUEURS_KILLER,
  LEGS,
  MAX_JOUEURS,
  SCORES,
  SETS,
  SORTIES,
  VIES,
} from './reglagesPossibles'

export const LIGNES_REJOUER = 3

const dans = (liste: readonly number[], valeur: number): boolean => liste.includes(valeur)

/** Le maximum de joueurs que le parcours accepte, jeu par jeu (le même que l'étape 2). */
const maxJoueurs = (mode: GameModeId): number => {
  switch (mode) {
    case 'KILLER':
      return JOUEURS_KILLER
    case 'CHECKOUT_PRACTICE':
      return JOUEURS_ENTRAINEMENT
    case 'X01':
    case 'TOUR_DU_MONDE':
    case 'CRICKET':
      return MAX_JOUEURS
    default: {
      // Un mode nouveau doit dire son maximum ici : sinon, écarté en silence.
      const jamais: never = mode
      return jamais
    }
  }
}

const memesCibles = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.length === b.length && a.every((cible, rang) => cible === b[rang])

/** Le parcours sait-il refaire cette configuration ? */
export const estReproductible = (configuration: ReplayableConfiguration): boolean => {
  // Plus de joueurs que le parcours n'en accepte pour CE jeu : jamais rejouée faussement.
  if (configuration.playerIds.length > maxJoueurs(configuration.mode)) return false
  switch (configuration.mode) {
    case 'X01': {
      const { startingScore, legsToWin, setsToWin, doubleOut, doubleIn } = configuration.config
      // Une sauvegarde importée peut porter un booléen mal typé ("oui") : écarté.
      return (
        dans(SCORES, startingScore) &&
        dans(LEGS, legsToWin) &&
        dans(SETS, setsToWin) &&
        typeof doubleOut === 'boolean' &&
        typeof doubleIn === 'boolean'
      )
    }
    case 'CRICKET':
      return memesCibles(configuration.config.targets, CricketConfig.create().targets)
    case 'TOUR_DU_MONDE':
      return memesCibles(configuration.config.targets, TourDuMondeConfig.create().targets)
    case 'KILLER': {
      const { startingLives, selfHitCostsLives } = configuration.config
      return (
        configuration.playerIds.length >= KILLER_MIN_PLAYERS &&
        dans(VIES, startingLives) &&
        typeof selfHitCostsLives === 'boolean'
      )
    }
    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = configuration.config
      return (
        configuration.playerIds.length === JOUEURS_ENTRAINEMENT &&
        dans(SORTIES, rounds) &&
        minTarget === DEFAUT_ENTRAINEMENT.minTarget &&
        maxTarget === DEFAUT_ENTRAINEMENT.maxTarget
      )
    }
    default: {
      const jamais: never = configuration
      return jamais
    }
  }
}

/**
 * Filtrer **d'abord**, couper ensuite : une configuration écartée laisse sa place à la suivante. `existe`
 * écarte aussi celle dont un profil a disparu depuis la lecture de l'historique.
 */
export const configurationsAffichees = (
  configurations: readonly ReplayableConfiguration[],
  existe: (id: PlayerId) => boolean = () => true,
): readonly ReplayableConfiguration[] =>
  configurations
    .filter(
      (configuration) => estReproductible(configuration) && configuration.playerIds.every(existe),
    )
    .slice(0, LIGNES_REJOUER)
