import type { SegmentNumber } from '../../domain/value-objects/Dart'
import type { RandomSource } from '../ports/driven/RandomSource'
import type { DrawKillerNumbers } from '../ports/driving/DrawKillerNumbers'
import { drawKillerNumbers } from './drawKillerNumbers'

export class DrawKillerNumbersUseCase implements DrawKillerNumbers {
  constructor(private readonly random: RandomSource) {}

  execute({
    count,
    excluded = [],
  }: {
    readonly count: number
    readonly excluded?: readonly SegmentNumber[]
  }): readonly SegmentNumber[] {
    return drawKillerNumbers(count, excluded, this.random)
  }
}
