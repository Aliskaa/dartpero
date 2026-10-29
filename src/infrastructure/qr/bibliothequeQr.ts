import type { QrMatrix } from '@/core/application/ports/driven/QrEncoder'

// ⚠️ Seul import de la bibliothèque QR, et seulement par `import()` : elle reste hors du démarrage.

/** Une image en RVBA, comme la rend une toile. */
export type ImageRvba = {
  readonly data: Uint8ClampedArray
  readonly width: number
  readonly height: number
}

export type BibliothequeQr = {
  /** Lève si le texte ne tient pas dans un QR. */
  encoder(texte: string): QrMatrix
  /** Le texte du premier QR lisible de l'image, sinon `null`. */
  decoder(image: ImageRvba): string | null
}

const ALPHANUMERIQUE = /^[0-9A-Z $%*+\-./:]*$/

let chargement: Promise<BibliothequeQr> | null = null

/** Chargée une fois, à la première demande ; un échec permet de réessayer. */
export const chargerBibliothequeQr = (): Promise<BibliothequeQr> => {
  if (chargement === null) {
    chargement = import('@nuintun/qrcode').then(
      ({ Alphanumeric, Byte, binarize, Decoder, Detector, Encoder, grayscale }) => ({
        encoder(texte) {
          // Le jeton est en base45 : le mode alphanumérique donne un QR plus petit, niveau M.
          const segment = ALPHANUMERIQUE.test(texte) ? new Alphanumeric(texte) : new Byte(texte)
          const code = new Encoder({ level: 'M' }).encode(segment)
          const modules = Array.from({ length: code.size }, (_, y) =>
            Array.from({ length: code.size }, (_, x) => code.get(x, y) === 1),
          )
          return { size: code.size, version: code.version, modules }
        },
        decoder(image) {
          const binaire = binarize(grayscale(image as ImageData), image.width, image.height)
          const detections = new Detector().detect(binaire)
          const decodeur = new Decoder()
          for (let essai = detections.next(); !essai.done; essai = detections.next(false)) {
            try {
              return decodeur.decode(essai.value.matrix).content
            } catch {}
          }
          return null
        },
      }),
    )
    chargement.catch(() => {
      chargement = null
    })
  }
  return chargement
}
