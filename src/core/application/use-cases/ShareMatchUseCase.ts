import { GameModes } from '../../domain/games'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PeerLink, PeerLinks, PeerOffer } from '../ports/driven/PeerLinks'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { PublishCommand, ShareMatch, ShareState } from '../ports/driving/ShareMatch'
import type { MirrorPlayer } from '../ports/driving/WatchMatch'
import { MirrorProtocol } from './mirrorProtocol'

const IDLE: ShareState = { status: 'idle' }

export class ShareMatchUseCase implements ShareMatch {
  private etat: ShareState = IDLE
  private readonly abonnes = new Set<() => void>()
  /** Chaque `start` / `stop` change de génération : un résultat tardif d'une ancienne est jeté. */
  private generation = 0
  private offre: PeerOffer | null = null
  private lien: PeerLink | null = null
  private desabonner: (() => void) | null = null
  private aEteOuvert = false
  private dernier: PublishCommand | null = null
  private envoye: PublishCommand | null = null
  private partieDue = false
  private voleeDue = false
  private pompe = false

  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly links: PeerLinks,
  ) {}

  state(): ShareState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  async start(): Promise<void> {
    this.fermer(true)
    const generation = ++this.generation
    this.regler({ status: 'preparing' })
    try {
      const resultat = await this.links.offer()
      if (generation !== this.generation) {
        if (resultat.ok) resultat.offer.link.close()
        return
      }
      if (!resultat.ok) return this.regler({ status: 'failed', reason: resultat.reason })
      this.offre = resultat.offer
      this.brancher(resultat.offer.link)
      this.regler({ status: 'offering', token: resultat.offer.token, rejected: null })
    } catch {
      if (generation === this.generation) this.regler({ status: 'failed', reason: 'failed' })
    }
  }

  async acceptAnswer(answerToken: string): Promise<void> {
    const offre = this.offre
    if (offre === null || this.etat.status !== 'offering') return
    const generation = this.generation
    try {
      const echec = await offre.accept(answerToken)
      if (generation !== this.generation || this.offre !== offre) return
      if (echec !== null) {
        return this.regler({ status: 'offering', token: offre.token, rejected: echec })
      }
      // Un seul lien à la fois : l'offre ne sert plus.
      this.offre = null
      this.suivreLien()
      if (this.etat.status === 'offering') this.regler({ status: 'connecting' })
    } catch {
      if (generation === this.generation) this.regler({ status: 'failed', reason: 'failed' })
    }
  }

  stop(): void {
    this.fermer(true)
    this.generation += 1
    this.regler(IDLE)
  }

  publish(command: PublishCommand): void {
    const avant = this.dernier
    this.dernier = command
    if (this.etat.status !== 'connected') return
    if (avant === null || avant.matchId !== command.matchId || avant.base !== command.base) {
      this.partieDue = true
    }
    this.voleeDue = true
    this.pomper()
  }

  private brancher(lien: PeerLink): void {
    this.lien = lien
    this.aEteOuvert = false
    this.desabonner = lien.subscribe(() => {
      if (this.lien === lien && this.offre === null) this.suivreLien()
    })
  }

  // ⚠️ Aucun `onMessage` ici : un miroir hostile ne peut rien faire faire à la saisie.
  private suivreLien(): void {
    const lien = this.lien
    if (lien === null) return
    const etat = lien.state()
    if (etat === 'open') {
      this.aEteOuvert = true
      this.regler({ status: 'connected' })
      // À chaque ouverture, l'instantané complet repart.
      this.envoye = null
      if (this.dernier !== null) {
        this.partieDue = true
        this.voleeDue = true
        this.pomper()
      }
    } else if (etat === 'lost' || etat === 'closed') {
      this.regler(this.aEteOuvert ? { status: 'lost' } : { status: 'failed', reason: 'failed' })
    }
  }

  // Le dernier gagne : au plus un `partie` et un `volee` en attente, `partie` toujours d'abord.
  private pomper(): void {
    if (this.pompe) return
    this.pompe = true
    void (async () => {
      try {
        while ((this.partieDue || this.voleeDue) && this.etat.status === 'connected') {
          if (this.partieDue) {
            this.partieDue = false
            await this.envoyerPartie()
          } else {
            this.voleeDue = false
            this.envoyerVolee()
          }
        }
      } finally {
        this.pompe = false
      }
    })()
  }

  private async envoyerPartie(): Promise<void> {
    const cible = this.dernier
    const lien = this.lien
    if (cible === null || lien === null) return
    try {
      const record = await this.matches.findById(cible.matchId)
      if (record === null || this.lien !== lien || this.etat.status !== 'connected') return
      const ouverture = record.events[0]
      const ids = ouverture !== undefined && 'playerIds' in ouverture ? ouverture.playerIds : []
      const profils = await Promise.all(ids.map((id) => this.players.findById(id)))
      const joueurs: MirrorPlayer[] = []
      for (const profil of profils) {
        if (profil !== null) joueurs.push(MirrorProtocol.playerOf(profil, record))
      }
      if (this.lien !== lien || this.etat.status !== 'connected') return
      lien.send(MirrorProtocol.encodeMatch(record, joueurs))
      this.envoye = cible
    } catch {
      // Lecture en échec : la prochaine publication réessaiera.
    }
  }

  private envoyerVolee(): void {
    const cible = this.dernier
    const lien = this.lien
    if (cible === null || lien === null || this.envoye?.matchId !== cible.matchId) return
    try {
      const volees = GameModes.visitCount(cible.base)
      lien.send(MirrorProtocol.encodeVisit(cible.matchId, volees, cible.darts))
    } catch {
      // Un état illisible ne coupe pas la saisie.
    }
  }

  private fermer(prevenir: boolean): void {
    const lien = this.lien
    this.desabonner?.()
    this.desabonner = null
    this.lien = null
    this.offre = null
    this.envoye = null
    this.partieDue = false
    this.voleeDue = false
    if (lien === null) return
    try {
      if (prevenir && lien.state() === 'open') lien.send(MirrorProtocol.encodeStop())
      lien.close()
    } catch {}
  }

  private regler(etat: ShareState): void {
    this.etat = etat
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {}
    }
  }
}
