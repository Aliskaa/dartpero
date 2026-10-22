import type { GameModeId } from '@/core/domain/games'
import type { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import {
  CRICKET_TARGETS,
  type CricketConfig,
  type CricketVariant,
} from '@/core/domain/games/cricket/config'
import type { KillerConfig } from '@/core/domain/games/killer/config'
import {
  TOUR_DU_MONDE_TARGETS,
  type TourDuMondeConfig,
} from '@/core/domain/games/tour-du-monde/config'
import type { X01Config } from '@/core/domain/games/x01/config'
import type { CheckoutRange } from '@/core/domain/services/checkout'
import type { Segment } from '@/core/domain/value-objects/Dart'
import type { ReglagesNouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  type ContenuRegles,
  type PlageSorties,
  reglesCricket,
  reglesEntrainement,
  reglesKiller,
  reglesTourDuMonde,
  reglesX01,
} from '@/ui/labels'

/**
 * Les règles d'une partie, telles que la feuille de règles les lit : une union discriminée par mode, faite
 * de primitives.
 */
export type ReglesDeLaPartie =
  | {
      readonly mode: 'X01'
      readonly score: number
      readonly legs: number
      readonly sets: number
      readonly doubleOut: boolean
      readonly doubleIn: boolean
    }
  | {
      readonly mode: 'CRICKET'
      readonly variante: CricketVariant
      readonly cibles: readonly Segment[]
    }
  | { readonly mode: 'TOUR_DU_MONDE'; readonly cibles: readonly Segment[] }
  | { readonly mode: 'KILLER'; readonly vies: number; readonly variante: boolean }
  | {
      readonly mode: 'CHECKOUT_PRACTICE'
      readonly sorties: number
      readonly min: number
      readonly max: number
    }

/** Les deux plages de sortie, lues par le port `GetCheckoutRange` : la feuille les montre toutes deux. */
export type SortiesDuJeu = {
  readonly surUnDouble: CheckoutRange
  readonly libre: CheckoutRange
}

const plage = ({ max, noFinish }: CheckoutRange): PlageSorties => ({ max, sansFinish: noFinish })

/**
 * Le texte de la feuille, pour les règles de ce soir. Le **seul** `switch` sur l'union : un mode ajouté
 * sans sa branche ne compile pas.
 */
export const contenuRegles = (regles: ReglesDeLaPartie, sorties: SortiesDuJeu): ContenuRegles => {
  switch (regles.mode) {
    case 'X01':
      return reglesX01({
        ...regles,
        sorties: { surUnDouble: plage(sorties.surUnDouble), libre: plage(sorties.libre) },
      })
    case 'CRICKET':
      return reglesCricket(regles)
    case 'TOUR_DU_MONDE':
      return reglesTourDuMonde(regles)
    case 'KILLER':
      return reglesKiller(regles)
    case 'CHECKOUT_PRACTICE':
      return reglesEntrainement(regles)
    default: {
      const jamais: never = regles
      return jamais
    }
  }
}

/** Les règles qu'on est en train de choisir, à l'étape 2. */
export const reglesDeLaFiche = (
  mode: GameModeId,
  reglages: ReglagesNouvellePartie,
): ReglesDeLaPartie => {
  switch (mode) {
    case 'X01':
      return {
        mode,
        score: reglages.score,
        legs: reglages.legs,
        sets: reglages.sets,
        doubleOut: reglages.doubleOut,
        doubleIn: reglages.doubleIn,
      }
    case 'CRICKET':
      return { mode, variante: reglages.variante, cibles: CRICKET_TARGETS }
    case 'TOUR_DU_MONDE':
      return { mode, cibles: TOUR_DU_MONDE_TARGETS }
    case 'KILLER':
      return { mode, vies: reglages.vies, variante: reglages.varianteKiller }
    case 'CHECKOUT_PRACTICE':
      return {
        mode,
        sorties: reglages.sorties,
        min: DEFAUT_ENTRAINEMENT.minTarget,
        max: DEFAUT_ENTRAINEMENT.maxTarget,
      }
    default: {
      const jamais: never = mode
      return jamais
    }
  }
}

export const reglesDeLaConfigX01 = (config: X01Config): ReglesDeLaPartie => ({
  mode: 'X01',
  score: config.startingScore,
  legs: config.legsToWin,
  sets: config.setsToWin,
  doubleOut: config.doubleOut,
  doubleIn: config.doubleIn,
})

export const reglesDeLaConfigCricket = (config: CricketConfig): ReglesDeLaPartie => ({
  mode: 'CRICKET',
  variante: config.variant,
  cibles: config.targets,
})

export const reglesDeLaConfigTourDuMonde = (config: TourDuMondeConfig): ReglesDeLaPartie => ({
  mode: 'TOUR_DU_MONDE',
  cibles: config.targets,
})

export const reglesDeLaConfigKiller = (config: KillerConfig): ReglesDeLaPartie => ({
  mode: 'KILLER',
  vies: config.startingLives,
  variante: config.selfHitCostsLives,
})

export const reglesDeLaConfigEntrainement = (config: CheckoutPracticeConfig): ReglesDeLaPartie => ({
  mode: 'CHECKOUT_PRACTICE',
  sorties: config.rounds,
  min: config.minTarget,
  max: config.maxTarget,
})
