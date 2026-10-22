import type { ReactNode } from 'react'
import type { GameModeId } from '@/core/domain/games'

/**
 * Les quatorze pictogrammes maison : cinq modes, neuf moments. Le mode se
 * reconnaît à sa forme, plus seulement à sa couleur (charte § Identité).
 * Les moments n'ont pas encore tous un emploi : leurs lots les attendent.
 */
export const PICTOGRAMMES = [
  'x01',
  'cricket',
  'tour-du-monde',
  'killer',
  'entrainement',
  '180',
  'bust',
  'sortie',
  'victoire',
  'moyenne',
  'grosses-volees',
  'meilleure-manche',
  'nul',
  'evolution',
] as const

export type NomPictogramme = (typeof PICTOGRAMMES)[number]

/** Quel pictogramme pour quel jeu : exporté pour que le test d'association le vérifie. */
export const PICTOGRAMME_PAR_MODE: Record<GameModeId, NomPictogramme> = {
  X01: 'x01',
  CRICKET: 'cricket',
  TOUR_DU_MONDE: 'tour-du-monde',
  KILLER: 'killer',
  CHECKOUT_PRACTICE: 'entrainement',
}

/**
 * Le plancher de 20 px est dans le type : une taille hors liste ne compile pas.
 * La liste s'élargit au besoin d'un lot, jamais par `className`.
 */
export type TaillePictogramme = 20 | 24 | 32 | 40 | 64

/**
 * Provenance des tracés calculés : grille 24, centre (12, 12), angle 0 en haut,
 * sens horaire, P(r, a) = (12 + r·cos(a − 90°), 12 + r·sin(a − 90°)), arrondi à
 * 2 décimales ; secteur(ri, re, d, f) = M P(re,d) A re re 0 0 1 P(re,f)
 * L P(ri,f) A ri ri 0 0 0 P(ri,d) Z. Calculés une fois, figés ici.
 *
 * - X01     : secteur(5, 10, -20, 20)
 * - entraînement : secteur(7, 10, 72, 108)
 * - sortie  : secteur(7, 10, -24, 24)
 * - Tour du monde : arc r 8.5 de 30° à 320° (grand arc, sens horaire) ; tête
 *   triangulaire au bout E = P(8.5, 320°), tangente t = (cos 320°, sin 320°),
 *   normale n = (sin 320°, −cos 320°) : sommets E + 3n, E + 3,6t, E − 3n.
 */
const SECTEUR_X01 = 'M8.58 2.6 A10 10 0 0 1 15.42 2.6 L13.71 7.3 A5 5 0 0 0 10.29 7.3 Z'
const SECTEUR_ENTRAINEMENT =
  'M21.51 8.91 A10 10 0 0 1 21.51 15.09 L18.66 14.16 A7 7 0 0 0 18.66 9.84 Z'
const SECTEUR_SORTIE = 'M7.93 2.86 A10 10 0 0 1 16.07 2.86 L14.85 5.61 A7 7 0 0 0 9.15 5.61 Z'
const ARC_TOUR_DU_MONDE = 'M16.25 4.64 A8.5 8.5 0 1 1 6.54 5.49'
const TETE_TOUR_DU_MONDE = 'M4.61 3.19 L9.29 3.17 L8.46 7.79 Z'

/** Un aplat : rempli de la couleur du texte, sans contour. */
const APLAT = { fill: 'currentColor', stroke: 'none' } as const

const FLECHES_180 = [5, 12, 19].map((x) => `M${x} 21.5 V10 M${x - 2.6} 3.5 L${x} 8 L${x + 2.6} 3.5`)

const TRACES: Record<NomPictogramme, ReactNode> = {
  x01: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="5" />
      <path d={SECTEUR_X01} {...APLAT} fillOpacity={0.9} />
      <circle cx="12" cy="12" r="1.3" {...APLAT} />
    </>
  ),
  cricket: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5" />
    </>
  ),
  // Le viseur du Killer (planche `killer`, tracé exact).
  killer: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 1.5 V6 M12 18 V22.5 M1.5 12 H6 M18 12 H22.5" />
      <circle cx="12" cy="12" r="1.8" {...APLAT} />
    </>
  ),
  'tour-du-monde': (
    <>
      <path d={ARC_TOUR_DU_MONDE} />
      <path d={TETE_TOUR_DU_MONDE} {...APLAT} />
      <circle cx="12" cy="12" r="2.4" {...APLAT} />
    </>
  ),
  entrainement: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="7" />
      <path d={SECTEUR_ENTRAINEMENT} {...APLAT} />
      <path d="M12 9.5 V14.5 M9.5 12 H14.5" strokeWidth={1.6} />
    </>
  ),
  '180': <path d={FLECHES_180.join(' ')} />,
  bust: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9 2.5 L13.5 9.5 L10 13 L15 21.5" />
    </>
  ),
  sortie: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d={SECTEUR_SORTIE} {...APLAT} />
      <path d="M7.5 13.5 L11 17 L16.5 11" />
    </>
  ),
  victoire: <path d="M3 18 V7 L8 12 L12 4.5 L16 12 L21 7 V18 Z M3 21.5 H21" />,
  moyenne: <path d="M4 20 L15 9 M15 9 L20 4 M17 4 H20 V7" />,
  'meilleure-manche': (
    <>
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 2.5 V4.5 M9.5 2.5 H14.5 M12 13.5 V9" />
    </>
  ),
  'grosses-volees': <path d="M5 4 V20 M9 4 V20 M13 4 V20 M17 4 V20 M2.5 17 L20.5 7" />,
  nul: <path d="M4 9 H20 M4 15 H20" />,
  // ⚠️ Exception à la famille (lot `courbe`, U9 a, planche) : trait de 3 et bouts
  // plats, la ligne brisée de la tendance en laiton de la carte Évolution.
  evolution: (
    <path d="M2.4 19.2 L8.4 12 L13.2 15.6 L21.6 4.8" strokeWidth={3} strokeLinecap="butt" />
  ),
}

type Props = {
  readonly nom: NomPictogramme
  readonly taille: TaillePictogramme
  /** La couleur (`text-…`) et `shrink-0` : la taille passe par `taille`. */
  readonly className?: string
}

/**
 * Un pictogramme maison : grille 24, trait de 2 px, extrémités et jonctions
 * vives, couleur du texte (`currentColor`) — jamais une couleur en dur.
 * Toujours `aria-hidden` : le sens est porté par un texte voisin.
 */
export const Pictogramme = ({ nom, taille, className }: Props) => (
  <svg
    viewBox="0 0 24 24"
    width={taille}
    height={taille}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    strokeLinejoin="miter"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {TRACES[nom]}
  </svg>
)
