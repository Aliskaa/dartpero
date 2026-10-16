import type { PlayerCareer, StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import {
  type MesureFinitions,
  type MesureMoyenne,
  moyenne,
  nombre,
  pourcent,
  type SeuilGrossesVolees,
  VALEUR_ABSENTE,
} from '@/ui/labels'

/** Les quatre cartes du podium, dans l'ordre de la planche. */
export const CARTES_PODIUM = ['MOYENNE', 'VICTOIRES', 'GROSSES_VOLEES', 'FINITIONS'] as const
export type CartePodiumId = (typeof CARTES_PODIUM)[number]

/** Le nombre de lignes montrées par carte avant « Tout voir » (Révision 1). */
export const APERCU_PODIUM: Record<CartePodiumId, number> = {
  MOYENNE: 5,
  VICTOIRES: 5,
  GROSSES_VOLEES: 3,
  FINITIONS: 5,
}

/**
 * Les N premiers d'un classement déjà trié, et s'il faut un « Tout voir ».
 *
 * 1. N + 1 lignes au plus : tout, sans bouton (un bouton pour une seule ligne
 *    cachée coûterait plus qu'elle).
 * 2. Sinon, si la N + 1-ième n'est pas à égalité avec la N-ième : N lignes.
 * 3. Sinon, tout le groupe d'égalité compte (lecture littérale, R1-Q1) :
 *    **exactement deux** → N + 1 lignes ; plus de deux → coupe net à N.
 *
 * L'égalité se juge sur `cle` — le chiffre affiché ; deux « — » (`null`) sont
 * égaux (R1-Q2). Jamais plus de N + 1 lignes visibles. On classe **avant** de
 * couper : teinte et largeurs sont les mêmes dans la carte et le modal.
 */
export const apercuPodium = <L>(
  lignes: readonly L[],
  n: number,
  cle: (ligne: L) => number | null,
): { readonly visibles: readonly L[]; readonly toutVoir: boolean } => {
  if (lignes.length <= n + 1) return { visibles: lignes, toutVoir: false }

  const derniere = lignes[n - 1]
  const suivante = lignes[n]
  if (derniere === undefined || suivante === undefined || cle(suivante) !== cle(derniere)) {
    return { visibles: lignes.slice(0, n), toutVoir: true }
  }

  const valeur = cle(derniere)
  const groupe = lignes.filter((ligne) => cle(ligne) === valeur).length
  return { visibles: lignes.slice(0, groupe === 2 ? n + 1 : n), toutVoir: true }
}

/**
 * LE PODIUM DES STATISTIQUES (lot `statistiques-podium`) — des fonctions pures,
 * sans React : le classement d'une carte, la largeur de ses barres, et le
 * joueur que montre la cible.
 *
 * ⚠️ Pas une règle de jeu : un tri sur une statistique **affichée**. Il vit
 * donc dans l'UI, comme `cartesPartie.ts`, et non dans `application`. Un
 * second écran qui en aurait besoin devrait le déplacer, pas le recopier.
 */

/** Ce qu'une carte classe : une valeur, son sens, et comment elle s'écrit. */
export type MesurePodium = {
  /**
   * Le **chiffre affiché**, en nombre — arrondi comme à l'écran (U5) : deux
   * « 41 % » sont ex aequo, même à 40,6 et 41,4. `null` = sans occasion.
   */
  readonly valeur: (joueur: PlayerCareer) => number | null
  /** « Plus grand vaut mieux », sauf la manche la plus courte. */
  readonly sens: 'decroissant' | 'croissant'
  /** Le texte de la valeur ; `—` quand `valeur` vaut `null`. */
  readonly texte: (joueur: PlayerCareer) => string
}

export type LignePodium = {
  readonly joueur: PlayerCareer
  readonly valeur: number | null
  readonly texte: string
  /** La part remplie de la barre, de 0 à 1. Jamais `NaN`. */
  readonly largeur: number
  /** À égalité avec le meilleur (jamais à zéro) : barre laiton. */
  readonly enTete: boolean
}

/** Arrondi à la précision de l'affichage. */
const arrondi = (valeur: number, decimales: 0 | 1): number =>
  decimales === 0 ? Math.round(valeur) : Math.round(valeur * 10) / 10

/**
 * Classe les joueurs sur une mesure.
 *
 * - Tri **stable** : à égalité, l'ordre reçu (celui de `GetPlayerStats` :
 *   moyenne décroissante, puis parties) est conservé — le premier de cet ordre
 *   prend la grande ligne.
 * - Sans occasion (`null`) : en dernier, barre vide.
 * - Largeur : `v / max` en décroissant, `min / v` en croissant (la manche la
 *   plus courte remplit sa barre).
 * - En tête : à égalité avec le meilleur, **si ce meilleur n'est pas 0**. Tous
 *   à égalité à une valeur non nulle (tous à 180, un joueur seul) : tous en
 *   tête. Jamais de dorure à zéro, et les sans occasion (`null`) ne comptent
 *   pas (décisions utilisateur, précisent U8b ; Q1 du plan de test).
 */
export const classerPodium = (
  joueurs: readonly PlayerCareer[],
  mesure: MesurePodium,
): readonly LignePodium[] => {
  const valeurs = joueurs.map((joueur) => ({ joueur, valeur: mesure.valeur(joueur) }))
  const presentes = valeurs.flatMap(({ valeur }) => (valeur === null ? [] : [valeur]))
  const croissant = mesure.sens === 'croissant'

  const classes = [...valeurs].sort((a, b) => {
    if (a.valeur === null || b.valeur === null) {
      return (a.valeur === null ? 1 : 0) - (b.valeur === null ? 1 : 0)
    }
    return croissant ? a.valeur - b.valeur : b.valeur - a.valeur
  })

  const max = presentes.length === 0 ? 0 : Math.max(...presentes)
  const min = presentes.length === 0 ? 0 : Math.min(...presentes)
  const meilleure = croissant ? min : max
  // ⚠️ Jamais de dorure à zéro (Q1) : un meilleur à 0 n'a rien gagné, même
  // devant des joueurs sans occasion (« 0 % » contre des « — »).
  const teinte = presentes.length > 0 && meilleure !== 0

  const largeur = (valeur: number | null): number => {
    if (valeur === null) return 0
    if (croissant) return valeur > 0 ? min / valeur : 0
    return max > 0 ? valeur / max : 0
  }

  return classes.map(({ joueur, valeur }) => ({
    joueur,
    valeur,
    texte: mesure.texte(joueur),
    largeur: largeur(valeur),
    enTete: teinte && valeur === meilleure,
  }))
}

/* Les mesures des cartes, une par bascule. */

const MOYENNE: MesurePodium = {
  valeur: (j) => arrondi(j.average3, 1),
  sens: 'decroissant',
  texte: (j) => moyenne(j.average3),
}

const FIRST_9: MesurePodium = {
  valeur: (j) => arrondi(j.first9Average, 1),
  sens: 'decroissant',
  texte: (j) => moyenne(j.first9Average),
}

const MEILLEURE_VOLEE: MesurePodium = {
  valeur: (j) => j.highestVisit,
  sens: 'decroissant',
  texte: (j) => nombre(j.highestVisit),
}

export const MESURE_MOYENNE: Record<MesureMoyenne, MesurePodium> = {
  MOYENNE,
  FIRST_9,
  VOLEE: MEILLEURE_VOLEE,
}

export const MESURE_VICTOIRES: MesurePodium = {
  valeur: (j) => j.matchesWon,
  sens: 'decroissant',
  texte: (j) => nombre(j.matchesWon),
}

export const MESURE_FINITIONS: Record<MesureFinitions, MesurePodium> = {
  DOUBLES: {
    // ⚠️ Aucune tentative : « — », jamais « 0 % » (`pourcent`), et dernier rang.
    valeur: (j) => (j.doubleAttempts === 0 ? null : arrondi(j.checkoutPercent, 0)),
    sens: 'decroissant',
    texte: (j) => pourcent(j.checkoutPercent, j.doubleAttempts),
  },
  PLUS_HAUT: {
    valeur: (j) => (j.highestCheckout === 0 ? null : j.highestCheckout),
    sens: 'decroissant',
    texte: (j) => (j.highestCheckout === 0 ? VALEUR_ABSENTE : nombre(j.highestCheckout)),
  },
  MANCHE: {
    // Le seul classement où **petit** vaut mieux : la manche la plus courte.
    valeur: (j) => j.bestLegDarts,
    sens: 'croissant',
    texte: (j) => (j.bestLegDarts === null ? VALEUR_ABSENTE : nombre(j.bestLegDarts)),
  },
}

/**
 * Grosses volées, classées sur le seuil de la bascule (Révision 1). Zéro est
 * une valeur : il se classe, il ne passe pas en « sans occasion ».
 */
export const MESURE_GROSSES_VOLEES: Record<SeuilGrossesVolees, MesurePodium> = {
  '180': { valeur: (j) => j.count180, sens: 'decroissant', texte: (j) => nombre(j.count180) },
  '140+': {
    valeur: (j) => j.count140plus,
    sens: 'decroissant',
    texte: (j) => nombre(j.count140plus),
  },
  '100+': {
    valeur: (j) => j.count100plus,
    sens: 'decroissant',
    texte: (j) => nombre(j.count100plus),
  },
}

/**
 * Le `scrollLeft` qui ramène un onglet dans la vue de son ruban, ou `null`
 * s'il y est déjà. Le moins de défilement possible : on aligne le bord qui
 * dépasse, jamais plus (constat 3 de la revue).
 */
export const defilementPourMontrer = ({
  debut,
  fin,
  defilement,
  largeur,
}: {
  /** Bords de l'onglet, dans le contenu du ruban. */
  readonly debut: number
  readonly fin: number
  /** `scrollLeft` et `clientWidth` du ruban. */
  readonly defilement: number
  readonly largeur: number
}): number | null => {
  if (debut < defilement) return debut
  if (fin > defilement + largeur) return Math.min(debut, fin - largeur)
  return null
}

/** Le joueur touché pendant la visite, et la période où il l'a été. */
export type ChoixCible = { readonly periode: StatsPeriod; readonly id: PlayerId }

/**
 * Le joueur que montre la cible.
 *
 * 1. Celui qu'on vient de toucher, sur la même période, s'il est dans la
 *    liste — même sans fléchette ou supprimé : on l'a choisi.
 * 2. Sinon le joueur mémorisé, s'il a encore un profil et au moins une
 *    fléchette sur la période.
 * 3. Sinon le premier de la moyenne. Liste vide : personne.
 *
 * `memorise` arrive brut du stockage local : seule une chaîne est prise au
 * sérieux, et elle ne sert qu'à une égalité contre la liste.
 */
export const joueurDeLaCible = (
  joueurs: readonly PlayerCareer[],
  periode: StatsPeriod,
  memorise: unknown,
  choix: ChoixCible | null,
): PlayerCareer | undefined => {
  if (choix !== null && choix.periode === periode) {
    const choisi = joueurs.find((joueur) => joueur.playerId === choix.id)
    if (choisi) return choisi
  }
  if (typeof memorise === 'string') {
    const retenu = joueurs.find((joueur) => joueur.playerId === memorise)
    if (retenu && retenu.name !== null && retenu.dartsThrown > 0) return retenu
  }
  return joueurs[0]
}
