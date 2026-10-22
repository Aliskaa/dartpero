import { DomainError } from '../../DomainError'
import type { Segment } from '../../value-objects/Dart'

export const CRICKET_TARGETS: readonly Segment[] = [20, 19, 18, 17, 16, 15, 'BULL']

// STANDARD : les points vont à celui qui marque, le plus grand score gagne.
// CUT_THROAT : ils vont aux adversaires qui n'ont pas fermé, le plus petit score gagne.
export const CRICKET_VARIANTS = ['STANDARD', 'CUT_THROAT'] as const

export type CricketVariant = (typeof CRICKET_VARIANTS)[number]

/** Cibles et variante vivent dans la config, donc dans le journal : une partie ancienne reste rejouable. */
export type CricketConfig = {
  readonly targets: readonly Segment[]
  readonly variant: CricketVariant
}

export type CricketConfigInput = {
  readonly targets?: readonly Segment[]
  readonly variant?: CricketVariant
}

// La bulle vaut 25 par marque : un bullseye (2 marques) fait 50.
export const targetValue = (target: Segment): number => (target === 'BULL' ? 25 : Number(target))

export const CricketConfig = {
  create({
    targets = CRICKET_TARGETS,
    variant = 'STANDARD',
  }: CricketConfigInput = {}): CricketConfig {
    if (targets.length === 0) throw new DomainError('A Cricket match needs at least one target')
    if (new Set(targets).size !== targets.length) {
      throw new DomainError('A Cricket target cannot appear twice')
    }
    if (targets.includes('MISS')) throw new DomainError('MISS cannot be a Cricket target')
    if (!CRICKET_VARIANTS.includes(variant)) {
      throw new DomainError(`Unknown Cricket variant: ${variant}`)
    }
    return { targets: [...targets], variant }
  },
}

export const MARKS_TO_CLOSE = 3
