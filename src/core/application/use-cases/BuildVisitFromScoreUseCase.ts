import { composeVisit } from '../../domain/games/x01/scoring'
import type { Dart } from '../../domain/value-objects/Dart'
import type {
  BuildVisitFromScore,
  BuildVisitFromScoreQuery,
} from '../ports/driving/BuildVisitFromScore'

export class BuildVisitFromScoreUseCase implements BuildVisitFromScore {
  execute({
    config,
    total,
    dartsUsed,
    finishOnDouble,
  }: BuildVisitFromScoreQuery): readonly Dart[] | null {
    return composeVisit(total, dartsUsed, finishOnDouble, config)
  }
}
