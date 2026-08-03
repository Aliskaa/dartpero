import type { RandomSource } from '@/core/application/ports/driven/RandomSource'

/**
 * Aléa du navigateur.
 *
 * `crypto.getRandomValues` plutôt que `Math.random` — non par besoin
 * cryptographique, mais parce que sa distribution est garantie et qu'on tire
 * ici des cibles d'entraînement : un biais donnerait toujours les mêmes restes.
 * Repli sur `Math.random` si l'API manque, ce qui n'arrive qu'en contexte non
 * sécurisé.
 */
export class CryptoRandomSource implements RandomSource {
  nextInt(max: number): number {
    if (max <= 0) return 0

    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      // Rejet des valeurs de la dernière tranche incomplète : sans ça, le
      // modulo favoriserait les premiers indices.
      const limite = Math.floor(0xff_ff_ff_ff / max) * max
      const tampon = new Uint32Array(1)
      let tirage = 0
      do {
        crypto.getRandomValues(tampon)
        tirage = tampon[0] ?? 0
      } while (tirage >= limite)
      return tirage % max
    }

    return Math.floor(Math.random() * max)
  }
}
