import { DomainError } from '../../DomainError'
import { SEGMENT_NUMBERS, type SegmentNumber } from '../../value-objects/Dart'

/**
 * Le **Killer** (lot `killer`) : chaque joueur a un numéro et des vies. On
 * devient killer en touchant le double de son propre numéro, puis on retire
 * les vies des adversaires en touchant les leurs. Le dernier en vie gagne.
 *
 * Règles validées par l'utilisateur : `CLAUDE.md` § Règles du Killer et
 * `docs/lots/killer/request.md`. Aucune n'est improvisée ici.
 */

/** Les numéros attribuables : 1 à 20. ⚠️ La bulle n'est **jamais** un numéro. */
export const KILLER_NUMBERS: readonly SegmentNumber[] = SEGMENT_NUMBERS

/**
 * Les vies de départ : 3 par défaut, 5 au choix. Liste **fermée** dans le
 * domaine : elle borne aussi ce qu'un fichier importé peut demander d'afficher
 * (un carré par vie).
 */
export const KILLER_LIVES = [3, 5] as const

export type KillerLives = (typeof KILLER_LIVES)[number]

/** 2 à 6 joueurs : pas de solo. */
export const KILLER_MIN_PLAYERS = 2
export const KILLER_MAX_PLAYERS = 6

/**
 * La configuration vit dans le journal. ⚠️ Les numéros n'en font **pas**
 * partie : ils sont écrits à côté de `playerIds` dans `KillerStarted`, pour
 * que « Rejouer » (mode + réglages + joueurs) ne les compte pas.
 */
export type KillerConfig = {
  readonly startingLives: KillerLives
  /**
   * La variante : un killer qui touche **son propre numéro** perd des vies, au
   * même barème que pour un adversaire. Désactivée par défaut.
   */
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
    // Un booléen mal typé (venu d'un fichier) est refusé, jamais converti.
    if (typeof selfHitCostsLives !== 'boolean') {
      throw new DomainError('selfHitCostsLives must be a boolean')
    }
    return { startingLives, selfHitCostsLives }
  },

  /** Revalide une configuration déjà typée (un journal relu, par exemple). */
  isValid: (config: KillerConfig): boolean =>
    estVie(config.startingLives) && typeof config.selfHitCostsLives === 'boolean',
}
