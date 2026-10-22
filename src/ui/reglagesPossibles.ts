import { KILLER_LIVES, KILLER_MAX_PLAYERS } from '@/core/domain/games/killer/config'

/** Les valeurs que l'étape 2 propose, jeu par jeu. */
export const SCORES = [301, 501, 701] as const
export const LEGS = [1, 2, 3, 4] as const
export const SETS = [1, 2, 3] as const
export const SORTIES = [5, 10, 20] as const
export const VIES = KILLER_LIVES
export const MAX_JOUEURS = 4
export const JOUEURS_KILLER = KILLER_MAX_PLAYERS
export const JOUEURS_ENTRAINEMENT = 1
