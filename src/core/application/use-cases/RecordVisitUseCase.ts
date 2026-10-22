import { DomainError } from '../../domain/DomainError'
import type { MatchEvent } from '../../domain/events/MatchEvent'
import { X01Rules } from '../../domain/games/x01/rules'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type {
  RecordVisit,
  RecordVisitCommand,
  RecordVisitResult,
} from '../ports/driving/RecordVisit'
import { loadMatch } from './loadMatch'

export class RecordVisitUseCase implements RecordVisit {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ matchId, darts }: RecordVisitCommand): Promise<RecordVisitResult> {
    const record = await loadMatch(this.matches, matchId)

    const avant = X01Rules.project(record.events)
    const apres = X01Rules.applyVisit(avant, darts)

    const events: readonly MatchEvent[] = [...record.events, { type: 'VisitRecorded', darts }]
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    const visit = apres.history.at(-1)
    if (!visit) throw new DomainError('The visit was not projected')

    return {
      state: apres,
      visit,
      milestones: apres.milestones.slice(avant.milestones.length),
    }
  }
}
