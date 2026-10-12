/**
 * La logique du glisser-déposer de l'ordre de jeu, **pure** — c'est la seule
 * partie du geste qu'on peut tester sans doigt. Le clavier et le pointeur
 * finissent tous deux par `deplacer` : un seul chemin pour réordonner.
 */

/**
 * Déplace l'élément de rang `de` au rang `vers`, les autres glissant d'un cran.
 * Hors bornes, ou sans déplacement, la liste revient telle quelle.
 */
export const deplacer = <T>(liste: readonly T[], de: number, vers: number): readonly T[] => {
  if (de === vers) return liste
  if (de < 0 || de >= liste.length || vers < 0 || vers >= liste.length) return liste
  const copie = [...liste]
  const [element] = copie.splice(de, 1)
  copie.splice(vers, 0, element as T)
  return copie
}

/**
 * Le rang visé par la ligne `de` quand son centre est à `centre`.
 *
 * `milieux` sont les centres verticaux des lignes **mesurés au début du
 * geste**, croissants. La ligne prend la place **la plus proche** de son
 * centre : le seuil entre deux places est à mi-chemin de leurs milieux, donc
 * une demi-ligne de mouvement suffit à changer de place, et moins ne fait rien.
 *
 * ⚠️ Le seuil n'est jamais sur un milieu. La borne du geste arrête le centre
 * de la ligne tenue **exactement** sur le milieu de la première / dernière
 * ligne : un seuil placé là (comparé en strict) rendait ces deux places
 * inatteignables au doigt — et à deux lignes, rien ne bougeait.
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

/**
 * Le décalage vertical (en px) de la ligne `rang` pendant qu'on glisse `de`
 * vers `vers` : les lignes enjambées font un pas de `hauteur` dans l'autre sens
 * pour libérer la place. La ligne tenue, elle, suit le doigt ailleurs.
 */
export const decalage = (rang: number, de: number, vers: number, hauteur: number): number => {
  if (rang === de) return 0
  if (de < vers && rang > de && rang <= vers) return -hauteur
  if (vers < de && rang >= vers && rang < de) return hauteur
  return 0
}
