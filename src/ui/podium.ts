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

/** Les quatre cartes du podium. */
export const CARTES_PODIUM = ['MOYENNE', 'VICTOIRES', 'GROSSES_VOLEES', 'FINITIONS'] as const
export type CartePodiumId = (typeof CARTES_PODIUM)[number]

export const APERCU_PODIUM: Record<CartePodiumId, number> = {
  MOYENNE: 5,
  VICTOIRES: 5,
  GROSSES_VOLEES: 3,
  FINITIONS: 5,
}

/** Les N premiers d'un classement déjà trié, et s'il faut un « Tout voir ». */
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
 * ⚠️ Pas une règle de jeu : un tri sur une statistique **affichée**. Il vit donc dans l'UI, comme
 * `cartesPartie.ts`, et non dans `application`.
 */

/** Ce qu'une carte classe : une valeur, son sens, et comment elle s'écrit. */
export type MesurePodium = {
  /**
   * Le **chiffre affiché**, en nombre — arrondi comme à l'écran : deux « 41 % » sont ex aequo, même à
   * 40,6 et 41,4. `null` = sans occasion.
   */
  readonly valeur: (joueur: PlayerCareer) => number | null
  readonly sens: 'decroissant' | 'croissant'
  readonly texte: (joueur: PlayerCareer) => string
}

export type LignePodium = {
  readonly joueur: PlayerCareer
  readonly valeur: number | null
  readonly texte: string
  readonly largeur: number
  readonly enTete: boolean
}

/** Arrondi à la précision de l'affichage. */
const arrondi = (valeur: number, decimales: 0 | 1): number =>
  decimales === 0 ? Math.round(valeur) : Math.round(valeur * 10) / 10

/** Classe les joueurs sur une mesure. */
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
  // ⚠️ Jamais de dorure à zéro : un meilleur à 0 n'a rien gagné, même
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
 * Grosses volées, classées sur le seuil de la bascule. Zéro est une valeur : il se classe, il
 * ne passe pas en « sans occasion ».
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
 * Le `scrollLeft` qui ramène un onglet dans la vue de son ruban, ou `null` s'il y est déjà. Le moins de
 * défilement possible : on aligne le bord qui dépasse, jamais plus.
 */
export const defilementPourMontrer = ({
  debut,
  fin,
  defilement,
  largeur,
}: {
  readonly debut: number
  readonly fin: number
  readonly defilement: number
  readonly largeur: number
}): number | null => {
  if (debut < defilement) return debut
  if (fin > defilement + largeur) return Math.min(debut, fin - largeur)
  return null
}

/** Le joueur touché pendant la visite, et la période où il l'a été. */
export type ChoixCible = { readonly periode: StatsPeriod; readonly id: PlayerId }

/** Le joueur que montre la cible. */
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
