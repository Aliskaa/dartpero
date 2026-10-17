/**
 * Les valeurs que l'étape 2 propose, jeu par jeu.
 *
 * Un module neutre, sans React : la fiche de réglages (`ReglagesJeu`), le hook
 * du parcours (`useNouvellePartie`) et la feuille de règles (« Les réglages
 * possibles », `labels.ts`) lisent la même liste. Ajouter une valeur ici la
 * propose à l'écran et la cite dans la feuille d'un seul geste.
 */
export const SCORES = [301, 501, 701] as const
/** Le nombre de manches à **gagner** — les anciens BO1 / BO3 / BO5 / BO7. */
export const LEGS = [1, 2, 3, 4] as const
export const SETS = [1, 2, 3] as const
export const SORTIES = [5, 10, 20] as const
/** Les joueurs d'une partie de groupe, au plus ; l'entraînement se joue seul. */
export const MAX_JOUEURS = 4
export const JOUEURS_ENTRAINEMENT = 1
