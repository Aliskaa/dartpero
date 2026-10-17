/**
 * Les clés TanStack Query partagées entre écrans.
 *
 * ⚠️ Ici et non dans `HistoriqueEcran` : l'Accueil (importé statiquement) les
 * lit aussi, et importer un écran lazy depuis lui annulerait le découpage.
 */

/** Préfixe de tout ce qui lit l'historique : l'invalider les rafraîchit toutes. */
export const CLE_HISTORIQUE = ['historique'] as const

/** Les configurations à rejouer : sous `CLE_HISTORIQUE`, donc rafraîchies avec lui. */
export const CLE_REJOUER = [...CLE_HISTORIQUE, 'rejouer'] as const

/** La partie en cours (la plus récente non terminée, parmi les 20 dernières). */
export const CLE_MATCH_EN_COURS = ['matchEnCours'] as const

/**
 * Le compte « N parties · M joueurs » des Réglages. Hors du préfixe
 * `historique` : l'import invalide tout le cache, et c'est le seul moment où
 * le compte change sans que l'on quitte l'écran.
 */
export const CLE_CONTENU_APPAREIL = ['contenuAppareil'] as const
