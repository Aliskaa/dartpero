/**
 * Une source d'aléa, derrière un port — comme `Clock` et `IdGenerator`.
 *
 * Le domaine n'a pas le droit d'appeler `Math.random()` : les règles doivent
 * être rejouables à l'identique. Le tirage vit donc dans un use case, qui
 * **écrit son résultat dans le journal** — rejouer une session d'entraînement
 * redonne exactement les mêmes cibles, pour toujours.
 */
export interface RandomSource {
  /** Un entier dans `[0, max[`. */
  nextInt(max: number): number
}

/** Aléa prévisible : toujours la première valeur. Utile aux tests et aux démos. */
export const FirstAlwaysRandom: RandomSource = {
  nextInt: () => 0,
}
