import type { AnyMatchState } from '../../../domain/games'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { PlayerId } from '../../../domain/value-objects/ids'
import type { PlayerColor } from '../../../domain/value-objects/PlayerColor'
import type { PlayerGender } from '../../../domain/value-objects/PlayerGender'
import type { MatchRecord } from '../driven/MatchRepository'
import type { PeerLinkFailure } from '../driven/PeerLinks'

/** Un joueur tel que l'envoie la saisie ; le genre n'y est que pour le Killer (garde `genreBoundary`). */
export type MirrorPlayer = {
  readonly id: PlayerId
  readonly name: string
  readonly color: PlayerColor
  readonly gender?: PlayerGender
}

export type MirrorView = {
  readonly record: MatchRecord
  /** Projeté depuis le journal reçu : fin, vainqueur et classement ne se lisent que là. */
  readonly state: AnyMatchState
  /** Profil supprimé = absent de la liste. */
  readonly players: readonly MirrorPlayer[]
  /** La volée en cours, déjà vérifiée contre le journal ; vide si incohérente. */
  readonly darts: readonly Dart[]
}

export type WatchState =
  | { readonly status: 'idle' }
  | { readonly status: 'preparing' }
  | { readonly status: 'answering'; readonly token: string }
  | { readonly status: 'connected'; readonly view: MirrorView | null }
  | { readonly status: 'lost'; readonly view: MirrorView | null }
  | { readonly status: 'stopped'; readonly view: MirrorView | null }
  | { readonly status: 'failed'; readonly reason: PeerLinkFailure }

/** Session du miroir : sans dépôt, elle ne peut rien écrire. Synchrone avec abonnement ; ne lève jamais. */
export interface WatchMatch {
  state(): WatchState
  subscribe(onChange: () => void): () => void
  /** Répond au jeton d'offre scanné ; un lien précédent est fermé. */
  answer(offerToken: string): Promise<void>
  stop(): void
}
