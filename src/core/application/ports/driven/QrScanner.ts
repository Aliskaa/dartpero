// ⚠️ Ne pas nommer ici les API de caméra du navigateur : la garde `reseauBoundary` lit aussi les commentaires.
export type QrScanState =
  | { readonly status: 'idle' }
  | { readonly status: 'starting' }
  | { readonly status: 'scanning' }
  | { readonly status: 'read'; readonly text: string }
  | { readonly status: 'denied' }
  | { readonly status: 'absent' }
  | { readonly status: 'failed' }

/** Générique sur le viseur : le cœur ignore le DOM, l'adapter y attache le flux, qui n'en sort jamais. */
export interface QrScanner<Viewfinder> {
  /** Synchrone, ne lève jamais, même objet tant que rien ne change. */
  state(): QrScanState
  subscribe(onChange: () => void): () => void
  /** Sur un geste de l'utilisateur seulement ; le premier QR lu arrête la caméra. */
  start(viewfinder: Viewfinder): void
  stop(): void
}

const ABSENT: QrScanState = { status: 'absent' }

export const NullQrScanner: QrScanner<unknown> = {
  state: () => ABSENT,
  subscribe: () => () => {},
  start: () => {},
  stop: () => {},
}
