import { DomainError } from '../../domain/DomainError'
import { type MatchState, X01Rules } from '../../domain/services/x01Rules'
import type { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { UndoLastVisit } from '../ports/driving/UndoLastVisit'
import { loadMatch } from './loadMatch'

export class UndoLastVisitUseCase implements UndoLastVisit {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  async execute(matchId: MatchId): Promise<MatchState> {
    const record = await loadMatch(this.matches, matchId)

    // Le premier événement est toujours MatchStarted : on n'y touche pas.
    if (record.events.length <= 1) throw new DomainError('No visit to undo')

    const events = record.events.slice(0, -1)
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return X01Rules.project(events)
  }
}
