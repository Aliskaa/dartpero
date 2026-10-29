import { GameModes } from '../../domain/games'
import type { Dart } from '../../domain/value-objects/Dart'
import type { MatchId } from '../../domain/value-objects/ids'
import type { PeerLink, PeerLinks } from '../ports/driven/PeerLinks'
import type { MirrorView, WatchMatch, WatchState } from '../ports/driving/WatchMatch'
import { MirrorProtocol } from './mirrorProtocol'

const IDLE: WatchState = { status: 'idle' }

type Volee = {
  readonly matchId: MatchId
  readonly visitCount: number
  readonly darts: readonly Dart[]
}

/** Seule dépendance : le lien. Sans dépôt, le miroir ne peut rien écrire, par construction. */
export class WatchMatchUseCase implements WatchMatch {
  private etat: WatchState = IDLE
  private readonly abonnes = new Set<() => void>()
  private generation = 0
  private lien: PeerLink | null = null
  private detacher: (() => void)[] = []
  private aEteOuvert = false
  private vue: MirrorView | null = null
  private volee: Volee | null = null

  constructor(private readonly links: PeerLinks) {}

  state(): WatchState {
    return this.etat
  }

  subscribe(onChange: () => void): () => void {
    this.abonnes.add(onChange)
    return () => {
      this.abonnes.delete(onChange)
    }
  }

  async answer(offerToken: string): Promise<void> {
    this.fermer()
    const generation = ++this.generation
    this.vue = null
    this.volee = null
    this.regler({ status: 'preparing' })
    try {
      const resultat = await this.links.answer(offerToken)
      if (generation !== this.generation) {
        if (resultat.ok) resultat.link.close()
        return
      }
      if (!resultat.ok) return this.regler({ status: 'failed', reason: resultat.reason })
      const lien = resultat.link
      this.lien = lien
      this.aEteOuvert = false
      this.detacher = [
        lien.subscribe(() => {
          if (this.lien === lien) this.suivreLien()
        }),
        lien.onMessage((message) => {
          if (this.lien === lien) this.recevoir(message)
        }),
      ]
      this.regler({ status: 'answering', token: resultat.token })
      this.suivreLien()
    } catch {
      if (generation === this.generation) this.regler({ status: 'failed', reason: 'failed' })
    }
  }

  stop(): void {
    this.fermer()
    this.generation += 1
    this.vue = null
    this.volee = null
    this.regler(IDLE)
  }

  private suivreLien(): void {
    const etat = this.lien?.state()
    if (etat === 'open') {
      this.aEteOuvert = true
      this.regler({ status: 'connected', view: this.vue })
    } else if (etat === 'lost' || etat === 'closed') {
      this.regler(
        this.aEteOuvert
          ? { status: 'lost', view: this.vue }
          : { status: 'failed', reason: 'failed' },
      )
    }
  }

  // Un message invalide est ignoré : la dernière image valide reste.
  private recevoir(message: string): void {
    const lu = MirrorProtocol.decode(message)
    switch (lu.kind) {
      case 'invalid':
        return
      case 'incompatible':
        this.fermer()
        this.generation += 1
        this.regler({ status: 'failed', reason: 'incompatible' })
        return
      case 'stop':
        this.fermer()
        this.generation += 1
        this.regler({ status: 'stopped', view: this.vue })
        return
      case 'match': {
        try {
          const state = GameModes.project(lu.record.events)
          this.vue = { record: lu.record, state, players: lu.players, darts: [] }
        } catch {
          return
        }
        break
      }
      case 'visit':
        this.volee = { matchId: lu.matchId, visitCount: lu.visitCount, darts: lu.darts }
        break
      default: {
        const jamais: never = lu
        void jamais
        return
      }
    }
    this.reevaluer()
  }

  // Cohérence du brouillon : même partie, même nombre de volées, partie non finie, volée jouable.
  private reevaluer(): void {
    const vue = this.vue
    if (vue === null) return
    const darts = this.voleeCoherente(vue)
    if (darts !== vue.darts) this.vue = { ...vue, darts }
    if (this.etat.status === 'connected') this.regler({ status: 'connected', view: this.vue })
  }

  private voleeCoherente(vue: MirrorView): readonly Dart[] {
    const volee = this.volee
    const vide = vue.darts.length === 0 ? vue.darts : []
    if (volee === null || volee.darts.length === 0) return vide
    if (volee.matchId !== vue.record.id || GameModes.isFinished(vue.state)) return vide
    if (volee.visitCount !== GameModes.visitCount(vue.state)) return vide
    try {
      GameModes.project([...vue.record.events, { type: 'VisitRecorded', darts: volee.darts }])
      return volee.darts
    } catch {
      return vide
    }
  }

  private fermer(): void {
    for (const detacher of this.detacher) detacher()
    this.detacher = []
    const lien = this.lien
    this.lien = null
    try {
      lien?.close()
    } catch {}
  }

  private regler(etat: WatchState): void {
    this.etat = etat
    for (const abonne of [...this.abonnes]) {
      try {
        abonne()
      } catch {}
    }
  }
}
