import { DomainError } from '../../domain/DomainError'
import type { CricketStarted } from '../../domain/events/MatchEvent'
import { CricketRules, type CricketState } from '../../domain/games/cricket/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type {
  CricketVisitResult,
  PlayCricket,
  StartCricketCommand,
} from '../ports/driving/PlayCricket'
import { loadMatch } from './loadMatch'

export class PlayCricketUseCase implements PlayCricket {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async start(command: StartCricketCommand): Promise<MatchId> {
    const { playerIds, config, startingPlayerIndex = 0 } = command

    const profils = await Promise.all(playerIds.map((id) => this.players.findById(id)))
    const inconnus = playerIds.filter((_, index) => !profils[index])
    if (inconnus.length > 0) throw new DomainError(`Unknown player(s): ${inconnus.join(', ')}`)

    const started: CricketStarted = {
      type: 'CricketStarted',
      config,
      playerIds,
      startingPlayerIndex,
    }
    // Valide la composition AVANT de persister quoi que ce soit.
    CricketRules.start(started)

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events: [started] })

    return id
  }

  async getState(matchId: MatchId): Promise<CricketState> {
    return CricketRules.project((await loadMatch(this.matches, matchId)).events)
  }

  async recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CricketVisitResult> {
    const record = await loadMatch(this.matches, matchId)

    const avant = CricketRules.project(record.events)
    // Applique les règles d'abord : si la volée est illégale, rien n'est écrit.
    const apres = CricketRules.applyVisit(avant, darts)

    await this.matches.save({
      ...record,
      events: [...record.events, { type: 'VisitRecorded', darts }],
      updatedAt: this.clock.now(),
    })

    const visit = apres.history.at(-1)
    if (!visit) throw new DomainError('The visit was not projected')

    return { state: apres, visit, milestones: apres.milestones.slice(avant.milestones.length) }
  }

  async undoLastVisit(matchId: MatchId): Promise<CricketState> {
    const record = await loadMatch(this.matches, matchId)

    // Le premier événement ouvre la partie : on n'y touche pas.
    if (record.events.length <= 1) throw new DomainError('No visit to undo')

    const events = record.events.slice(0, -1)
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return CricketRules.project(events)
  }
}
