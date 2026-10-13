import { DomainError } from '../../domain/DomainError'
import type { TourDuMondeStarted } from '../../domain/events/MatchEvent'
import { TourDuMondeRules, type TourDuMondeState } from '../../domain/games/tour-du-monde/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { RandomSource } from '../ports/driven/RandomSource'
import type {
  PlayTourDuMonde,
  StartTourDuMondeCommand,
  TourDuMondeVisitResult,
} from '../ports/driving/PlayTourDuMonde'
import { loadMatch } from './loadMatch'
import { nameField } from './nameField'
import { shufflePlayers } from './shufflePlayers'

export class PlayTourDuMondeUseCase implements PlayTourDuMonde {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource,
  ) {}

  async start(command: StartTourDuMondeCommand): Promise<MatchId> {
    const { config, startingPlayerIndex = 0, shuffle = false } = command
    // Le nom d'abord : trop long, rien n'est tiré ni écrit.
    const name = nameField(command.name)
    // Le tirage a lieu ici, une fois, et son résultat part dans le journal.
    const playerIds = shuffle ? shufflePlayers(command.playerIds, this.random) : command.playerIds

    const profils = await Promise.all(playerIds.map((id) => this.players.findById(id)))
    const inconnus = playerIds.filter((_, index) => !profils[index])
    if (inconnus.length > 0) throw new DomainError(`Unknown player(s): ${inconnus.join(', ')}`)

    const started: TourDuMondeStarted = {
      type: 'TourDuMondeStarted',
      config,
      playerIds,
      startingPlayerIndex,
      ...name,
    }
    // Valide la composition AVANT de persister quoi que ce soit.
    TourDuMondeRules.start(started)

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events: [started] })

    return id
  }

  async getState(matchId: MatchId): Promise<TourDuMondeState> {
    return TourDuMondeRules.project((await loadMatch(this.matches, matchId)).events)
  }

  async recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<TourDuMondeVisitResult> {
    const record = await loadMatch(this.matches, matchId)

    const avant = TourDuMondeRules.project(record.events)
    // Applique les règles d'abord : si la volée est illégale, rien n'est écrit.
    const apres = TourDuMondeRules.applyVisit(avant, darts)

    await this.matches.save({
      ...record,
      events: [...record.events, { type: 'VisitRecorded', darts }],
      updatedAt: this.clock.now(),
    })

    const visit = apres.history.at(-1)
    if (!visit) throw new DomainError('The visit was not projected')

    return { state: apres, visit, milestones: apres.milestones.slice(avant.milestones.length) }
  }

  async undoLastVisit(matchId: MatchId): Promise<TourDuMondeState> {
    const record = await loadMatch(this.matches, matchId)

    // Le premier événement ouvre la partie : on n'y touche pas.
    if (record.events.length <= 1) throw new DomainError('No visit to undo')

    const events = record.events.slice(0, -1)
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return TourDuMondeRules.project(events)
  }
}
