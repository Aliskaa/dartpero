import type { RandomSource } from '@/core/application/ports/driven/RandomSource'

/** `crypto.getRandomValues` (distribution garantie), repli sur `Math.random` en contexte non sécurisé. */
export class CryptoRandomSource implements RandomSource {
  nextInt(max: number): number {
    if (max <= 0) return 0

    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      // Rejet de la dernière tranche incomplète : sinon le modulo favorise les premiers indices.
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
