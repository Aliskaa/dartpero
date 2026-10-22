/** La logique pure du glisser-déposer de l'ordre de jeu ; clavier et pointeur passent par `deplacer`. */

/** Déplace l'élément de rang `de` au rang `vers` ; hors bornes, la liste revient telle quelle. */
export const deplacer = <T>(liste: readonly T[], de: number, vers: number): readonly T[] => {
  if (de === vers) return liste
  if (de < 0 || de >= liste.length || vers < 0 || vers >= liste.length) return liste
  const copie = [...liste]
  const [element] = copie.splice(de, 1)
  copie.splice(vers, 0, element as T)
  return copie
}

/**
 * Le rang visé par la ligne `de` : la place la plus proche de `centre` (`milieux` mesurés au début du geste).
 * ⚠️ Le seuil n'est jamais sur un milieu : sinon les places extrêmes seraient inatteignables.
 */
export const rangVise = (milieux: readonly number[], de: number, centre: number): number => {
  let vers = de
  for (let rang = de + 1; rang < milieux.length; rang += 1) {
    const avant = milieux[rang - 1] ?? Number.POSITIVE_INFINITY
    const ici = milieux[rang] ?? Number.POSITIVE_INFINITY
    if (centre > (avant + ici) / 2) vers = rang
  }
  for (let rang = de - 1; rang >= 0; rang -= 1) {
    const ici = milieux[rang] ?? Number.NEGATIVE_INFINITY
    const apres = milieux[rang + 1] ?? Number.NEGATIVE_INFINITY
    if (centre < (ici + apres) / 2) vers = rang
  }
  return vers
}

/** Le décalage vertical (px) de la ligne `rang` pendant qu'on glisse `de` vers `vers`. */
export const decalage = (rang: number, de: number, vers: number, hauteur: number): number => {
  if (rang === de) return 0
  if (de < vers && rang > de && rang <= vers) return -hauteur
  if (vers < de && rang >= vers && rang < de) return hauteur
  return 0
}
