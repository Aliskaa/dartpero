import type { SegmentNumber } from '../../../domain/value-objects/Dart'

// `excluded` : numéros déjà pris. `DomainError` s'il ne reste pas assez de numéros libres.
export interface DrawKillerNumbers {
  execute(input: {
    readonly count: number
    readonly excluded?: readonly SegmentNumber[]
  }): readonly SegmentNumber[]
}
