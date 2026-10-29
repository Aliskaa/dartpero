import type { GameModeId } from '@/core/domain/games'

/**
 * ⚠️ **Chaque étape est une route**, jamais un état interne : c'est ce qui fait que le retour du téléphone
 * ramène à l'étape précédente.
 */
const RACINE = '/nouvelle-partie'

export const SLUG_MODE: Record<GameModeId, string> = {
  X01: 'x01',
  CRICKET: 'cricket',
  TOUR_DU_MONDE: 'tour-du-monde',
  KILLER: 'killer',
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

/** Posé sur chaque navigation **vers l'avant** du parcours. */
export const ETAT_PARCOURS = { parcours: true } as const

export const vientDuParcours = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  (state as { readonly parcours?: unknown }).parcours === true

/** Écran miroir : le partage côté saisie, l'affichage côté miroir (écrans pleins, le retour annule). */
export const CHEMIN_PARTAGE = '/miroir/partager'
export const CHEMIN_MIROIR = '/miroir'

/** Posé par le bouton du bandeau de partie : « Retour à la partie » plutôt que « Retour ». */
export const ETAT_DEPUIS_PARTIE = { depuisPartie: true } as const

export const vientDeLaPartie = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  (state as { readonly depuisPartie?: unknown }).depuisPartie === true
