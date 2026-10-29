import { describe, expect, it } from 'vitest'
import type { QrMatrix } from '@/core/application/ports/driven/QrEncoder'
import { chargerBibliothequeQr, type ImageRvba } from '@/infrastructure/qr/bibliothequeQr'
import { LibraryQrEncoder } from '@/infrastructure/qr/LibraryQrEncoder'

// Jeton base45 de 147 caractères, la longueur mesurée sur Android.
const JETON = 'NCF%2C$%*+-./: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(3).slice(0, 147)

/** Modules sombres sur fond clair, zone de silence de 4 modules, `pixels` par module. */
const image = (qr: QrMatrix, pixels = 4, sombre = 0, clair = 255): ImageRvba => {
  const cote = (qr.size + 8) * pixels
  const data = new Uint8ClampedArray(cote * cote * 4).fill(clair)
  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      const mx = Math.floor(x / pixels) - 4
      const my = Math.floor(y / pixels) - 4
      if (qr.modules[my]?.[mx]) {
        const i = (y * cote + x) * 4
        data[i] = sombre
        data[i + 1] = sombre
        data[i + 2] = sombre
      }
    }
  }
  return { data, width: cote, height: cote }
}

describe('Bibliothèque QR, chargée à la demande', () => {
  it('aller-retour réel : jeton → QR alphanumérique M → pixels → texte', async () => {
    const bibliotheque = await chargerBibliothequeQr()
    const qr = bibliotheque.encoder(JETON)

    expect(qr.size).toBe(17 + 4 * qr.version)
    expect(qr.version).toBeLessThanOrEqual(7)
    expect(bibliotheque.decoder(image(qr))).toBe(JETON)
    // Faible contraste, 3 px par module : lu quand même.
    expect(bibliotheque.decoder(image(qr, 3, 80, 140))).toBe(JETON)
  })

  it('une image sans QR rend null, sans lever', async () => {
    const bibliotheque = await chargerBibliothequeQr()
    const vide = { data: new Uint8ClampedArray(64 * 64 * 4).fill(255), width: 64, height: 64 }
    expect(bibliotheque.decoder(vide)).toBeNull()
  })

  it('un texte hors alphabet passe en octets', async () => {
    const qr = (await chargerBibliothequeQr()).encoder('jeton en minuscules')
    expect((await chargerBibliothequeQr()).decoder(image(qr))).toBe('jeton en minuscules')
  })

  it('l’encodeur ne rejette jamais : bibliothèque absente ou texte trop long = null', async () => {
    const absente = new LibraryQrEncoder(() => Promise.reject(new Error('hors ligne')))
    expect(await absente.encode(JETON)).toBeNull()
    expect(await new LibraryQrEncoder().encode('A'.repeat(5000))).toBeNull()
    expect((await new LibraryQrEncoder().encode(JETON))?.version).toBeLessThanOrEqual(7)
  })
})
