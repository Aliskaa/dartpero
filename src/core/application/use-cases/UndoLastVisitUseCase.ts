import { DomainError } from '../../domain/DomainError'
import { X01Rules, type X01State } from '../../domain/games/x01/rules'
import type { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { ReopenedVisit } from '../ports/driving/ReopenedVisit'
import type { UndoLastVisit } from '../ports/driving/UndoLastVisit'
import { loadMatch } from './loadMatch'

export class UndoLastVisitUseCase implements UndoLastVisit {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  async execute(matchId: MatchId): Promise<ReopenedVisit<X01State>> {
    const record = await loadMatch(this.matches, matchId)

    // La dernière volée **projetée** : ses fléchettes sont déjà coupées à celle
    // qui a conclu (bust ou sortie).
    const derniere = X01Rules.project(record.events).history.at(-1)
    // Le premier événement est toujours X01Started : on n'y touche pas.
    if (!derniere || record.events.length <= 1) throw new DomainError('No visit to undo')

    const events = record.events.slice(0, -1)
    // Projeter AVANT d'écrire : un journal qui ne se rejoue pas n'est pas sauvé.
    const state = X01Rules.project(events)
    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return { state, darts: derniere.darts.slice(0, -1) }
  }
}
