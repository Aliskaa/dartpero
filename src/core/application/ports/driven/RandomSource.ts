// ⚠️ Le tirage vit dans un use case qui écrit son résultat au journal (le domaine reste rejouable).
export interface RandomSource {
  /** Un entier dans `[0, max[`. */
  nextInt(max: number): number
}

export const FirstAlwaysRandom: RandomSource = {
  nextInt: () => 0,
}
