import type { GameModeId } from '@/core/domain/games'

/**
 * Les adresses du parcours « Nouvelle partie », en un seul endroit.
 *
 * ⚠️ **Chaque étape est une route**, jamais un état interne : c'est ce qui fait
 * que le retour du téléphone ramène à l'étape précédente. Les chemins sont
 * toujours **absolus** — sous le splat `/nouvelle-partie/*`, un `to` relatif se
 * résoudrait contre l'étape courante et empilerait les segments.
 */
const RACINE = '/nouvelle-partie'

/** Le jeu tel qu'il s'écrit dans l'URL. Liste fermée : un slug inconnu renvoie à l'étape 1. */
export const SLUG_MODE: Record<GameModeId, string> = {
  X01: 'x01',
  CRICKET: 'cricket',
  TOUR_DU_MONDE: 'tour-du-monde',
  CHECKOUT_PRACTICE: 'entrainement',
}

/** Étape 1 sans argument, étape 2 (joueurs et réglages) avec un jeu. */
export const cheminNouvellePartie = (mode?: GameModeId): string =>
  mode ? `${RACINE}/${SLUG_MODE[mode]}` : RACINE

/** Étape 3 : l'ordre de jeu. */
export const cheminOrdre = (mode: GameModeId): string => `${cheminNouvellePartie(mode)}/ordre`

/** L'écran plein « Sélectionner un joueur existant ». */
export const cheminJoueursExistants = (mode: GameModeId): string =>
  `${cheminNouvellePartie(mode)}/joueurs`

/** Le jeu d'un slug d'URL, ou `null` s'il n'est pas dans la liste. */
export const modeDuSlug = (slug: string | undefined): GameModeId | null => {
  const trouve = (Object.entries(SLUG_MODE) as [GameModeId, string][]).find(
    ([, valeur]) => valeur === slug,
  )
  return trouve ? trouve[0] : null
}

/**
 * Posé sur chaque navigation **vers l'avant** du parcours. Il dit au bouton
 * retour de l'écran qu'une entrée précédente existe dans l'historique : il peut
 * alors faire `navigate(-1)`, exactement comme le retour du téléphone. Sans lui
 * (lien profond, page rechargée), le retour remplace l'entrée par l'étape
 * précédente au lieu de quitter l'app.
 */
export const ETAT_PARCOURS = { parcours: true } as const

export const vientDuParcours = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  (state as { readonly parcours?: unknown }).parcours === true
