import type { AnyMatchState } from '../../../domain/games'
import type { Dart } from '../../../domain/value-objects/Dart'
import type { MatchId } from '../../../domain/value-objects/ids'
import type { PeerLinkFailure } from '../driven/PeerLinks'

export type ShareState =
  | { readonly status: 'idle' }
  | { readonly status: 'preparing' }
  /** `rejected` : la dernière réponse scannée n'a pas été acceptée, on peut rescanner. */
  | {
      readonly status: 'offering'
      readonly token: string
      readonly rejected: PeerLinkFailure | null
    }
  | { readonly status: 'connecting' }
  | { readonly status: 'connected' }
  | { readonly status: 'lost' }
  | { readonly status: 'failed'; readonly reason: PeerLinkFailure }

export type PublishCommand = {
  readonly matchId: MatchId
  /** L'état affiché ; un objet nouveau signale un journal changé. */
  readonly base: AnyMatchState
  readonly darts: readonly Dart[]
}

/** Session de la saisie : synchrone avec abonnement, ne lève jamais, sourde aux messages entrants. */
export interface ShareMatch {
  state(): ShareState
  subscribe(onChange: () => void): () => void
  /** Prépare une offre ; un lien précédent est fermé. */
  start(): Promise<void>
  acceptAnswer(answerToken: string): Promise<void>
  stop(): void
  /** Inactive, la session ne fait que retenir le dernier appel. */
  publish(command: PublishCommand): void
}
