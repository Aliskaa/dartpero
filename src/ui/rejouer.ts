import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { JOUEURS_ENTRAINEMENT, LEGS, MAX_JOUEURS, SCORES, SETS, SORTIES } from './reglagesPossibles'

/** Les trois lignes de la section « Rejouer ». */
export const LIGNES_REJOUER = 3

const dans = (liste: readonly number[], valeur: number): boolean => liste.includes(valeur)

const memesCibles = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.length === b.length && a.every((cible, rang) => cible === b[rang])

/**
 * Le parcours sait-il refaire cette configuration ? Un module neutre, sans React :
 * `application` ne peut pas lire `reglagesPossibles.ts`, c'est donc l'UI qui écarte
 * ce qu'elle ne sait pas régler (une partie importée hors des listes, des cibles
 * qui ne sont pas celles du défaut) — jamais rejouée faussement.
 */
export const estReproductible = (configuration: ReplayableConfiguration): boolean => {
  // Plus de joueurs que le parcours n'en accepte : jamais rejouée faussement.
  if (configuration.playerIds.length > MAX_JOUEURS) return false
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
    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = configuration.config
      return (
        configuration.playerIds.length === JOUEURS_ENTRAINEMENT &&
        dans(SORTIES, rounds) &&
        minTarget === DEFAUT_ENTRAINEMENT.minTarget &&
        maxTarget === DEFAUT_ENTRAINEMENT.maxTarget
      )
    }
  }
}

/**
 * Filtrer **d'abord**, couper ensuite : une configuration écartée laisse sa place à la suivante.
 * `existe` écarte aussi celle dont un profil a disparu depuis la lecture de l'historique.
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
