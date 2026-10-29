/** Les modules d'un QR, ligne par ligne (`true` = module sombre), sans zone de silence. */
export type QrMatrix = {
  readonly size: number
  readonly version: number
  readonly modules: readonly (readonly boolean[])[]
}

export interface QrEncoder {
  /** `null` si le texte ne tient pas ou si la bibliothèque manque. Ne rejette jamais. */
  encode(text: string): Promise<QrMatrix | null>
}

export const NullQrEncoder: QrEncoder = {
  encode: async () => null,
}
