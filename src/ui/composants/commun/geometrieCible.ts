/**
 * La géométrie d'un plateau de fléchettes — l'ordre des secteurs et les rayons
 * des anneaux, en proportions d'une vraie cible.
 *
 * Extraite de `Cible` le jour où un **deuxième** dessin en a eu besoin (la
 * carte des impacts). Deux copies de ces rayons, ce serait deux plateaux qui
 * finiraient par ne plus se superposer.
 *
 * Tout est exprimé sur une `viewBox` de 100 × 100, centre (50, 50).
 */

/** L'ordre officiel des secteurs, en partant du 20 et dans le sens horaire. */
export const ORDRE = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const

export const SECTEUR = 360 / ORDRE.length

export const R = {
  bordExterieur: 50,
  numeros: 48.6,
  doubleExterieur: 47,
  doubleInterieur: 43.5,
  tripleExterieur: 29.5,
  tripleInterieur: 26,
  anneau25: 8,
  bullseye: 3.4,
} as const

export const point = (rayon: number, angle: number): readonly [number, number] => {
  const radians = ((angle - 90) * Math.PI) / 180
  return [50 + rayon * Math.cos(radians), 50 + rayon * Math.sin(radians)]
}

/** Un secteur annulaire : l'unité de base d'un plateau. */
export const trace = (interieur: number, exterieur: number, debut: number, fin: number): string => {
  const [x1, y1] = point(exterieur, debut)
  const [x2, y2] = point(exterieur, fin)
  const [x3, y3] = point(interieur, fin)
  const [x4, y4] = point(interieur, debut)
  return [
    `M${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A${exterieur} ${exterieur} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A${interieur} ${interieur} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join('')
}

/** Les bornes angulaires d'un secteur, repéré par son rang dans `ORDRE`. */
export const angles = (rang: number): readonly [number, number] => {
  const debut = rang * SECTEUR - SECTEUR / 2
  return [debut, debut + SECTEUR]
}

/** Le rang d'un numéro de secteur dans `ORDRE`, ou `-1` s'il n'y est pas. */
export const rangDuSecteur = (numero: number): number => ORDRE.indexOf(numero as never)
