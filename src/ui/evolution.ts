import {
  type PlayerProgress,
  type ProgressMeasures,
  type ProgressPoint,
  TREND_SPAN,
} from '@/core/domain/games/x01/progress'
import type { MesureMoyenne } from '@/ui/labels'
import { defilementPourMontrer } from '@/ui/podium'

/**
 * LA CARTE ÉVOLUTION — des fonctions pures, sans React : la géométrie de la courbe, son axe vertical, et ce
 * que l'on voit quand elle défile.
 */

export const PLANCHE = {
  largeur: 320,
  hauteur: 190,
  gauche: 30,
  droite: 10,
  haut: 10,
  bas: 24,
} as const

/** La gouttière de l'axe vertical, en unités de la planche. */
export const LARGEUR_GOUTTIERE = 25
/** La fenêtre visible du tracé, en unités : ce qui reste de la planche. */
export const LARGEUR_FENETRE = PLANCHE.largeur - LARGEUR_GOUTTIERE
export const MARGE_GAUCHE = PLANCHE.gauche - LARGEUR_GOUTTIERE
/** De la première à la dernière partie, quand la courbe tient. */
const ETENDUE = PLANCHE.largeur - PLANCHE.gauche - PLANCHE.droite

/**
 * Le nombre de parties visibles d'un coup : ≈ 20 px par partie à 390 px, la
 * planche à l'identique. Au-delà, la courbe défile dans sa fenêtre, au même pas.
 */
export const PARTIES_VISIBLES = 14

/**
 * Au-delà de ce déplacement entre l'appui et le lâcher, c'est un glissé : il ne sélectionne jamais (N1,
 * appui seul), même quand rien ne défile.
 */
export const SEUIL_GLISSE_PX = 10

/** La marge gardée autour d'un point ramené dans la vue au clavier, en unités. */
const MARGE_VUE = 10

export type GeometrieCourbe = {
  readonly parties: number
  readonly pas: number
  readonly largeurContenu: number
  readonly defile: boolean
}

/**
 * Jusqu'à 14 parties, la planche : les points de 5 à 285, sans défilement. Au-delà, le pas de 14 parties
 * (280 / 13 unités), et un contenu de 5 + (n − 1)·pas + 10.
 */
export const geometrieCourbe = (parties: number): GeometrieCourbe => {
  if (parties <= PARTIES_VISIBLES) {
    return {
      parties,
      pas: parties > 1 ? ETENDUE / (parties - 1) : 0,
      largeurContenu: LARGEUR_FENETRE,
      defile: false,
    }
  }
  const pas = ETENDUE / (PARTIES_VISIBLES - 1)
  return {
    parties,
    pas,
    largeurContenu: MARGE_GAUCHE + (parties - 1) * pas + PLANCHE.droite,
    defile: true,
  }
}

/** L'abscisse d'une partie dans la fenêtre. Une seule partie : au centre du tracé. */
export const abscisse = (geometrie: GeometrieCourbe, index: number): number =>
  geometrie.parties <= 1 ? MARGE_GAUCHE + ETENDUE / 2 : MARGE_GAUCHE + index * geometrie.pas

/**
 * La largeur CSS du SVG tracé, en % de la fenêtre : la fenêtre montre toujours 295 unités, donc le tracé
 * garde l'échelle de la gouttière (hauteur `auto`).
 */
export const pourcentageLargeur = (geometrie: GeometrieCourbe): number =>
  (100 * geometrie.largeurContenu) / LARGEUR_FENETRE

/** Ce que l'on sait de la fenêtre qui défile, en pixels. */
export type Defilement = {
  readonly defilement: number
  readonly largeurVisible: number
}

/** La partie la plus proche d'un appui, `position` comptée en pixels depuis le bord de la fenêtre. */
export const indexDepuisPosition = (
  geometrie: GeometrieCourbe,
  { position, defilement, largeurVisible }: Defilement & { readonly position: number },
): number => {
  const dernier = geometrie.parties - 1
  if (geometrie.parties <= 1 || largeurVisible <= 0) return Math.max(0, dernier)
  const unites = ((position + defilement) * LARGEUR_FENETRE) / largeurVisible
  const index = Math.round((unites - MARGE_GAUCHE) / geometrie.pas)
  return Math.min(dernier, Math.max(0, index))
}

/** La portion visible du tracé, en unités ; `null` quand la fenêtre n'a pas de largeur. */
export type Vue = { readonly debut: number; readonly fin: number }

export const vueDepuisDefilement = ({ defilement, largeurVisible }: Defilement): Vue | null => {
  if (largeurVisible <= 0) return null
  const debut = (defilement * LARGEUR_FENETRE) / largeurVisible
  return { debut, fin: debut + LARGEUR_FENETRE }
}

const EPSILON = 1e-6

/** La première et la dernière partie dont le point est dans la vue. Courbe qui tient : toutes. */
export const indicesVisibles = (
  geometrie: GeometrieCourbe,
  vue: Vue | null,
): { readonly premier: number; readonly dernier: number } => {
  const dernier = Math.max(0, geometrie.parties - 1)
  if (!geometrie.defile || vue === null) return { premier: 0, dernier }
  const borne = (index: number) => Math.min(dernier, Math.max(0, index))
  const premier = borne(Math.ceil((vue.debut - MARGE_GAUCHE) / geometrie.pas - EPSILON))
  const fin = borne(Math.floor((vue.fin - MARGE_GAUCHE) / geometrie.pas + EPSILON))
  return fin < premier ? { premier, dernier: premier } : { premier, dernier: fin }
}

export type AncreDate = 'start' | 'middle' | 'end'

/**
 * Les trois dates sous la courbe : début, milieu (⌊(premier + dernier) / 2⌋) et fin de la **portion
 * visible** ; quand la courbe tient, celles de la planche.
 */
export const datesSousLaCourbe = (
  geometrie: GeometrieCourbe,
  vue: Vue | null,
): readonly { readonly index: number; readonly ancre: AncreDate }[] => {
  const { premier, dernier } = indicesVisibles(geometrie, vue)
  if (premier === dernier) return [{ index: premier, ancre: 'middle' }]
  const milieu = Math.floor((premier + dernier) / 2)
  return [
    { index: premier, ancre: 'start' as const },
    ...(milieu !== premier && milieu !== dernier
      ? [{ index: milieu, ancre: 'middle' as const }]
      : []),
    { index: dernier, ancre: 'end' as const },
  ]
}

/**
 * Le `scrollLeft` qui ramène une partie dans la vue (sélection au clavier), ou `null` si elle y est déjà :
 * le défilement **minimal** des onglets de joueurs.
 */
export const defilementPourPoint = (
  geometrie: GeometrieCourbe,
  index: number,
  { defilement, largeurVisible }: Defilement,
): number | null => {
  if (!geometrie.defile || largeurVisible <= 0) return null
  const pixels = largeurVisible / LARGEUR_FENETRE
  const x = abscisse(geometrie, index)
  return defilementPourMontrer({
    debut: Math.max(0, x - MARGE_VUE) * pixels,
    fin: Math.min(geometrie.largeurContenu, x + MARGE_VUE) * pixels,
    defilement,
    largeur: largeurVisible,
  })
}

export type AxeVertical = {
  readonly bas: number
  readonly haut: number
  readonly pas: number
  readonly graduations: readonly number[]
}

const PAS_AXE: Record<MesureMoyenne, number> = { MOYENNE: 5, FIRST_9: 5, VOLEE: 40 }
const INTERVALLES_MAX = 6
/** Au-delà, l'axe rend ce qu'il a : 40 × 2⁴⁰ dépasse de loin toute valeur réelle. */
const DOUBLEMENTS_MAX = 40

/**
 * ⚠️ Ajustement hors planche : le bas ne descend jamais sous 0 (une moyenne n'est jamais négative), et un
 * axe plat (une seule valeur, multiple du pas) gagne un pas en haut.
 */
export const axeVertical = (mesure: MesureMoyenne, valeurs: readonly number[]): AxeVertical => {
  // Garde défensive : une valeur non finie (`NaN`, `Infinity`) ferait boucler le
  // doublement du pas sans fin. Elle est ignorée, et le doublement est borné.
  const finies = valeurs.filter((valeur) => Number.isFinite(valeur))
  // `reduce` plutôt que `Math.min(...)` : l'étalement d'une longue série (plusieurs
  // centaines de parties, courbe défilante) n'a pas à dépendre de la pile d'appel.
  const [premiere = 0] = finies
  const min = finies.reduce((plus_bas, valeur) => Math.min(plus_bas, valeur), premiere)
  const max = finies.reduce((plus_haut, valeur) => Math.max(plus_haut, valeur), premiere)
  const marge = mesure !== 'VOLEE'
  let pas = PAS_AXE[mesure]
  for (let doublements = 0; ; doublements++) {
    const bas = Math.max(0, Math.floor(min / pas) * pas - (marge ? pas : 0))
    const plafond = Math.ceil(max / pas) * pas
    const haut = plafond > bas ? plafond : bas + pas
    const intervalles = Math.round((haut - bas) / pas)
    if (intervalles <= INTERVALLES_MAX || doublements >= DOUBLEMENTS_MAX) {
      return {
        bas,
        haut,
        pas,
        graduations:
          intervalles <= INTERVALLES_MAX
            ? Array.from({ length: intervalles + 1 }, (_, rang) => bas + rang * pas)
            : [bas, haut],
      }
    }
    pas *= 2
  }
}

/** L'ordonnée d'une valeur, dans la `viewBox` de 190 de haut. */
export const ordonnee = (axe: AxeVertical, valeur: number): number =>
  PLANCHE.haut +
  ((axe.haut - valeur) / (axe.haut - axe.bas)) * (PLANCHE.hauteur - PLANCHE.haut - PLANCHE.bas)

export const MESURE_EVOLUTION: Record<
  MesureMoyenne,
  { readonly valeur: (mesures: ProgressMeasures) => number; readonly decimales: 0 | 1 }
> = {
  MOYENNE: { valeur: (m) => m.average3, decimales: 1 },
  FIRST_9: { valeur: (m) => m.first9Average, decimales: 1 },
  VOLEE: { valeur: (m) => m.highestVisit, decimales: 0 },
}

/** La tendance démarre à la 3ᵉ partie : en deçà, l'état « peu de parties ». */
export const PARTIES_POUR_TENDANCE = TREND_SPAN

/** La moyenne de la période (ligne pointillée) : Moyenne et First 9 seulement. */
export const referenceDe = (progression: PlayerProgress, mesure: MesureMoyenne): number | null => {
  if (progression.points.length < PARTIES_POUR_TENDANCE) return null
  switch (mesure) {
    case 'MOYENNE':
      return progression.reference.average3
    case 'FIRST_9':
      return progression.reference.first9Average
    case 'VOLEE':
      return null
    default: {
      const jamais: never = mesure
      return jamais
    }
  }
}

/** Tout ce que l'axe doit encadrer : les points, les tendances, la ligne pointillée. */
export const valeursTracees = (
  progression: PlayerProgress,
  mesure: MesureMoyenne,
): readonly number[] => {
  const { valeur } = MESURE_EVOLUTION[mesure]
  const reference = referenceDe(progression, mesure)
  return [
    ...progression.points.map((point) => valeur(point.value)),
    ...progression.points.flatMap((point) => (point.trend === null ? [] : [valeur(point.trend)])),
    ...(reference === null ? [] : [reference]),
  ]
}

/**
 * La courbe franchit-elle un changement d'année ? Alors les dates portent l'année, partout (axe et lecture)
 * ; sinon jamais.
 */
export const franchitUneAnnee = (points: readonly ProgressPoint[]): boolean => {
  const premier = points[0]
  const dernier = points[points.length - 1]
  if (!premier || !dernier) return false
  return new Date(premier.createdAt).getFullYear() !== new Date(dernier.createdAt).getFullYear()
}
