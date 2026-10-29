import type { QrEncoder, QrMatrix } from '@/core/application/ports/driven/QrEncoder'
import { type BibliothequeQr, chargerBibliothequeQr } from './bibliothequeQr'

export class LibraryQrEncoder implements QrEncoder {
  constructor(private readonly charger: () => Promise<BibliothequeQr> = chargerBibliothequeQr) {}

  async encode(text: string): Promise<QrMatrix | null> {
    try {
      const bibliotheque = await this.charger()
      return bibliotheque.encoder(text)
    } catch {
      return null
    }
  }
}
