import { DomainError } from '../../DomainError'
import { SEGMENT_NUMBERS, type SegmentNumber } from '../../value-objects/Dart'

/** ⚠️ La bulle n'est jamais un numéro. */
export const KILLER_NUMBERS: readonly SegmentNumber[] = SEGMENT_NUMBERS

// Liste fermée : elle borne aussi ce qu'un fichier importé peut demander d'afficher.
export const KILLER_LIVES = [3, 5] as const

export type KillerLives = (typeof KILLER_LIVES)[number]

export const KILLER_MIN_PLAYERS = 2
export const KILLER_MAX_PLAYERS = 6

/** ⚠️ Les numéros n'en font pas partie : ils sont dans `KillerStarted`. */
export type KillerConfig = {
  readonly startingLives: KillerLives
  /** Variante : un killer qui touche son propre numéro perd des vies. */
  readonly selfHitCostsLives: boolean
}

export type KillerConfigInput = {
  readonly startingLives?: number
  readonly selfHitCostsLives?: boolean
}

const estVie = (valeur: unknown): valeur is KillerLives =>
  KILLER_LIVES.some((vies) => vies === valeur)

export const KillerConfig = {
  create({ startingLives = 3, selfHitCostsLives = false }: KillerConfigInput = {}): KillerConfig {
    if (!estVie(startingLives)) {
      throw new DomainError(`Killer starting lives must be one of ${KILLER_LIVES.join(', ')}`)
    }
    if (typeof selfHitCostsLives !== 'boolean') {
      throw new DomainError('selfHitCostsLives must be a boolean')
    }
    return { startingLives, selfHitCostsLives }
  },

  isValid: (config: KillerConfig): boolean =>
    estVie(config.startingLives) && typeof config.selfHitCostsLives === 'boolean',
}
