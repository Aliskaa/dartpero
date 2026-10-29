import type {
  PeerAnswerResult,
  PeerLink,
  PeerLinkFailure,
  PeerLinkState,
  PeerLinks,
  PeerOfferResult,
} from '@/core/application/ports/driven/PeerLinks'
import { encoderJeton, type Jeton, lireJeton, type Role, sdpDepuisJeton } from './jetonDeJumelage'
import { decouper, Reassembleur } from './trames'

// ⚠️ Seul fichier de src/ qui ouvre un RTCPeerConnection (garde `reseauBoundary`).

/** La part d'un canal que lit l'adapter, injectable pour les tests. */
export type CanalPair = EventTarget & {
  readonly readyState: string
  send(texte: string): void
  close(): void
}

/** La part d'une connexion que lit l'adapter, injectable pour les tests. */
export type ConnexionPair = EventTarget & {
  readonly localDescription: { readonly sdp: string } | null
  readonly iceGatheringState: string
  readonly connectionState: string
  createDataChannel(label: string, options: { readonly ordered: boolean }): CanalPair
  createOffer(): Promise<{ readonly type: string; readonly sdp?: string }>
  createAnswer(): Promise<{ readonly type: string; readonly sdp?: string }>
  setLocalDescription(description: { readonly type: string; readonly sdp?: string }): Promise<void>
  setRemoteDescription(description: {
    readonly type: 'offer' | 'answer'
    readonly sdp: string
  }): Promise<void>
  close(): void
}

/** Aucun serveur : ni STUN ni TURN, candidats locaux seulement. */
export type FabriqueConnexion = (configuration: { readonly iceServers: [] }) => ConnexionPair

const fabriqueDuNavigateur = (): FabriqueConnexion | undefined =>
  typeof RTCPeerConnection === 'undefined'
    ? undefined
    : (configuration) => new RTCPeerConnection(configuration) as unknown as ConnexionPair

/** Collecte ICE mesurée à ≈ 130 ms sur téléphone ; au-delà, on part avec ce qu'on a. */
const DELAI_COLLECTE_MS = 3000

const ETATS_PERDUS = new Set(['disconnected', 'failed', 'closed'])

class LienWebRtc implements PeerLink {
  private etat: PeerLinkState = 'connecting'
  private canal: CanalPair | null = null
  private dejaOuvert = false
  private readonly abonnes = new Set<() => void>()
  private readonly ecouteurs = new Set<(texte: string) => void>()
  private readonly reassembleur = new Reassembleur()

  constructor(private readonly connexion: ConnexionPair) {
    connexion.addEventListener('connectionstatechange', () => this.recalculer())
    connexion.addEventListener('datachannel', (evenement) => {
      const canal = (evenement as Event & { readonly channel?: CanalPair }).channel
      if (canal && this.canal === null) this.brancher(canal)
    })
  }

  brancher(canal: CanalPair): void {
    this.canal = canal
    canal.addEventListener('open', () => this.recalculer())
    canal.addEventListener('close', () => this.recalculer())
    canal.addEventListener('message', (evenement) => {
      if (this.etat === 'closed') return
      const complet = this.reassembleur.recevoir((evenement as MessageEvent).data)
      if (complet === null) return
      for (const ecouteur of [...this.ecouteurs]) {
        try {
          ecouteur(complet)
        } catch {}
      }
    })
  }

  state(): PeerLinkState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  send(texte: string): void {
    const canal = this.canal
    if (this.etat !== 'open' || canal === null) return
    try {
      for (const trame of decouper(texte)) canal.send(trame)
    } catch {
      // Tampon plein ou canal fermé entre-temps : la prochaine publication renverra tout.
    }
  }

  onMessage(listener: (texte: string) => void): () => void {
    this.ecouteurs.add(listener)
    return () => {
      this.ecouteurs.delete(listener)
    }
  }

  close(): void {
    if (this.etat === 'closed') return
    this.regler('closed')
    try {
      this.canal?.close()
    } catch {}
    try {
      this.connexion.close()
    } catch {}
  }

  // Ouvert = canal ouvert et connexion non perdue ; un retour à `connected` rouvre sans nouveau QR.
  private recalculer(): void {
    if (this.etat === 'closed') return
    try {
      const connexion = this.connexion.connectionState
      const canal = this.canal?.readyState
      if (canal === 'open' && !ETATS_PERDUS.has(connexion)) {
        this.dejaOuvert = true
        this.regler('open')
        return
      }
      // Avant la première ouverture, seul l'échec compte : `disconnected` peut n'être qu'un passage.
      const perdu = this.dejaOuvert
        ? ETATS_PERDUS.has(connexion) || canal === 'closed' || canal === 'closing'
        : connexion === 'failed' || connexion === 'closed' || canal === 'closed'
      if (perdu) this.regler('lost')
    } catch {
      this.regler('lost')
    }
  }

  private regler(etat: PeerLinkState): void {
    if (this.etat === etat) return
    this.etat = etat
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {}
    }
  }
}

const vers = (raison: 'illisible' | 'incompatible'): PeerLinkFailure =>
  raison === 'incompatible' ? 'incompatible' : 'unreadable'

export class WebRtcPeerLinks implements PeerLinks {
  constructor(
    private readonly fabrique: FabriqueConnexion | undefined = fabriqueDuNavigateur(),
    private readonly delaiCollecteMs = DELAI_COLLECTE_MS,
  ) {}

  async offer(): Promise<PeerOfferResult> {
    if (!this.fabrique) return { ok: false, reason: 'unavailable' }
    let connexion: ConnexionPair | null = null
    try {
      connexion = this.fabrique({ iceServers: [] })
      const lien = new LienWebRtc(connexion)
      lien.brancher(connexion.createDataChannel('dartpero-miroir', { ordered: true }))
      const description = await connexion.createOffer()
      const local = await this.decrire(connexion, description, 'offre')
      const pc = connexion
      return {
        ok: true,
        offer: {
          token: local.jeton,
          link: lien,
          accept: async (answerToken) => {
            const lu = lireJeton(answerToken)
            if (!lu.ok) return vers(lu.raison)
            if (lu.jeton.role !== 'reponse') return 'unreadable'
            if (local.candidats === 0 && lu.jeton.candidats.length === 0) {
              return 'no-local-candidate'
            }
            try {
              await pc.setRemoteDescription({ type: 'answer', sdp: sdpDepuisJeton(lu.jeton) })
              return null
            } catch {
              return 'failed'
            }
          },
        },
      }
    } catch {
      fermer(connexion)
      return { ok: false, reason: 'failed' }
    }
  }

  async answer(offerToken: string): Promise<PeerAnswerResult> {
    if (!this.fabrique) return { ok: false, reason: 'unavailable' }
    const lu = lireJeton(offerToken)
    if (!lu.ok) return { ok: false, reason: vers(lu.raison) }
    if (lu.jeton.role !== 'offre') return { ok: false, reason: 'unreadable' }
    const offre: Jeton = lu.jeton
    let connexion: ConnexionPair | null = null
    try {
      connexion = this.fabrique({ iceServers: [] })
      const lien = new LienWebRtc(connexion)
      await connexion.setRemoteDescription({ type: 'offer', sdp: sdpDepuisJeton(offre) })
      const description = await connexion.createAnswer()
      const local = await this.decrire(connexion, description, 'reponse')
      // Il suffit qu'un côté soit joignable : l'autre est appris au passage.
      if (local.candidats === 0 && offre.candidats.length === 0) {
        lien.close()
        return { ok: false, reason: 'no-local-candidate' }
      }
      return { ok: true, token: local.jeton, link: lien }
    } catch {
      fermer(connexion)
      return { ok: false, reason: 'failed' }
    }
  }

  // ⚠️ Sans trickle : le jeton n'est écrit qu'une fois la collecte finie (ou le délai passé).
  private async decrire(
    connexion: ConnexionPair,
    description: { readonly type: string; readonly sdp?: string },
    role: Role,
  ): Promise<{ readonly jeton: string; readonly candidats: number }> {
    const attente = attendreCollecte(connexion, this.delaiCollecteMs)
    await connexion.setLocalDescription(description)
    await attente
    const jeton = encoderJeton(connexion.localDescription?.sdp ?? '', role)
    return { jeton: jeton.jeton, candidats: jeton.gardes.length }
  }
}

const attendreCollecte = (connexion: ConnexionPair, delaiMs: number): Promise<void> =>
  new Promise((resoudre) => {
    let minuterie: ReturnType<typeof setTimeout> | undefined
    const finir = () => {
      if (minuterie !== undefined) clearTimeout(minuterie)
      connexion.removeEventListener('icegatheringstatechange', verifier)
      resoudre()
    }
    const verifier = () => {
      if (connexion.iceGatheringState === 'complete') finir()
    }
    connexion.addEventListener('icegatheringstatechange', verifier)
    minuterie = setTimeout(finir, delaiMs)
    verifier()
  })

const fermer = (connexion: ConnexionPair | null): void => {
  try {
    connexion?.close()
  } catch {}
}
