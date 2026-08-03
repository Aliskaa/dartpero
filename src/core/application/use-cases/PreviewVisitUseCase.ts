import { X01Rules } from '../../domain/games/x01/rules'
import type { PreviewVisit, PreviewVisitQuery, VisitPreview } from '../ports/driving/PreviewVisit'

export class PreviewVisitUseCase implements PreviewVisit {
  execute({ config, remaining, hasOpened, darts }: PreviewVisitQuery): VisitPreview {
    const resolution = X01Rules.resolveVisit(config, remaining, hasOpened, darts)

    return {
      outcome: resolution.outcome,
      scored: resolution.scored,
      remainingAfter: resolution.remainingAfter,
      dartsUsed: resolution.dartsUsed,
      complete: resolution.outcome !== 'SCORED' || darts.length >= 3,
    }
  }
}
