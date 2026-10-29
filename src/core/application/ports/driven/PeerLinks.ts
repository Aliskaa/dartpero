// ⚠️ Ne pas nommer ici les API du lien du navigateur : la garde `reseauBoundary` lit aussi les commentaires.
export type PeerLinkState = 'connecting' | 'open' | 'lost' | 'closed'

export type PeerLinkFailure =
  | 'unavailable'
  | 'unreadable'
  | 'incompatible'
  | 'no-local-candidate'
  | 'failed'

/** Un lien direct vers l'autre téléphone. Ne lève jamais ; `closed` n'arrive que par `close()`. */
export interface PeerLink {
  state(): PeerLinkState
  subscribe(onChange: () => void): () => void
  /** Livré entier et dans l'ordre, ou pas du tout si le lien n'est pas ouvert. */
  send(text: string): void
  onMessage(listener: (text: string) => void): () => void
  close(): void
}

export type PeerOffer = {
  /** Jeton opaque à montrer à l'autre téléphone (le QR n'en est qu'un porteur). */
  readonly token: string
  readonly link: PeerLink
  /** `null` si la réponse est acceptée. Ne rejette jamais. */
  accept(answerToken: string): Promise<PeerLinkFailure | null>
}

export type PeerOfferResult =
  | { readonly ok: true; readonly offer: PeerOffer }
  | { readonly ok: false; readonly reason: PeerLinkFailure }

export type PeerAnswerResult =
  | { readonly ok: true; readonly token: string; readonly link: PeerLink }
  | { readonly ok: false; readonly reason: PeerLinkFailure }

/** Jumelage par jetons opaques, produits et lus par l'adapter seul. Ne rejette jamais. */
export interface PeerLinks {
  offer(): Promise<PeerOfferResult>
  answer(offerToken: string): Promise<PeerAnswerResult>
}

export const NullPeerLinks: PeerLinks = {
  offer: async () => ({ ok: false, reason: 'unavailable' }),
  answer: async () => ({ ok: false, reason: 'unavailable' }),
}
