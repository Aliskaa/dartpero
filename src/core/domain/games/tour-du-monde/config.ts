import { DomainError } from '../../DomainError'
import { SEGMENT_NUMBERS, type Segment } from '../../value-objects/Dart'

export const TOUR_DU_MONDE_TARGETS: readonly Segment[] = [...[...SEGMENT_NUMBERS].reverse(), 'BULL']

/** Les cibles vivent dans la config, donc dans le journal : une partie ancienne reste rejouable. */
export type TourDuMondeConfig = {
  readonly targets: readonly Segment[]
}

export type TourDuMondeConfigInput = {
  readonly targets?: readonly Segment[]
}

export const TourDuMondeConfig = {
  create({ targets = TOUR_DU_MONDE_TARGETS }: TourDuMondeConfigInput = {}): TourDuMondeConfig {
    if (targets.length === 0) throw new DomainError('A Tour du monde needs at least one target')
    return { targets: [...targets] }
  },
}
