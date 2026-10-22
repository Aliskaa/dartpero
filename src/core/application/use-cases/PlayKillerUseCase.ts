import { DomainError } from '../../domain/DomainError'
import type { KillerStarted } from '../../domain/events/MatchEvent'
import { KillerRules, type KillerState } from '../../domain/games/killer/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { RandomSource } from '../ports/driven/RandomSource'
import type { KillerVisitResult, PlayKiller, StartKillerCommand } from '../ports/driving/PlayKiller'
import type { ReopenedVisit } from '../ports/driving/ReopenedVisit'
import { drawKillerNumbers } from './drawKillerNumbers'
import { loadMatch } from './loadMatch'
import { nameField } from './nameField'

export class PlayKillerUseCase implements PlayKiller {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource,
  ) {}

  async start(command: StartKillerCommand): Promise<MatchId> {
    const { config, playerIds, startingPlayerIndex = 0 } = command
    const name = nameField(command.name)

    const profils = await Promise.all(playerIds.map((id) => this.players.findById(id)))
    const inconnus = playerIds.filter((_, index) => !profils[index])
    if (inconnus.length > 0) throw new DomainError(`Unknown player(s): ${inconnus.join(', ')}`)

    const numbers = command.numbers ?? drawKillerNumbers(playerIds.length, [], this.random)

    const started: KillerStarted = {
      type: 'KillerStarted',
      config,
      playerIds,
      numbers,
      startingPlayerIndex,
      ...name,
    }
    KillerRules.start(started)

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events: [started] })

    return id
  }

  async getState(matchId: MatchId): Promise<KillerState> {
    return KillerRules.project((await loadMatch(this.matches, matchId)).events)
  }

  async recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<KillerVisitResult> {
    const record = await loadMatch(this.matches, matchId)

    const avant = KillerRules.project(record.events)
    const apres = KillerRules.applyVisit(avant, darts)
    const visit = apres.history.at(-1)
    if (!visit) throw new DomainError('The visit was not projected')

    // Seules les fléchettes jouées partent (volée tronquée à celle qui gagne ou élimine).
    await this.matches.save({
      ...record,
      events: [...record.events, { type: 'VisitRecorded', darts: visit.darts }],
      updatedAt: this.clock.now(),
    })

    return { state: apres, visit, milestones: apres.milestones.slice(avant.milestones.length) }
  }

  async undoLastVisit(matchId: MatchId): Promise<ReopenedVisit<KillerState>> {
    const record = await loadMatch(this.matches, matchId)

    const derniere = KillerRules.project(record.events).history.at(-1)
    if (!derniere || record.events.length <= 1) throw new DomainError('No visit to undo')

    const events = record.events.slice(0, -1)
    // Projeter avant d'écrire : un journal qui ne se rejoue pas n'est pas sauvé.
    const state = KillerRules.project(events)
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return { state, darts: derniere.darts.slice(0, -1) }
  }
}
