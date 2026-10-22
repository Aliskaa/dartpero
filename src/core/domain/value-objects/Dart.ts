import { DomainError } from '../DomainError'

export const SEGMENT_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const

export type SegmentNumber = (typeof SEGMENT_NUMBERS)[number]

/** `BULL` : simple 25, double 50. `MISS` explicite : une manquée compte dans la moyenne et les tentatives de double. */
export type Segment = SegmentNumber | 'BULL' | 'MISS'

export type Multiplier = 'SIMPLE' | 'DOUBLE' | 'TRIPLE'

export type Dart = {
  readonly segment: Segment
  readonly multiplier: Multiplier
}

const MULTIPLIER_FACTOR: Record<Multiplier, number> = {
  SIMPLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
}

const estSegmentNumerote = (segment: Segment): segment is SegmentNumber =>
  typeof segment === 'number'

export const Dart = {
  /** Seul point d'entrée validant. */
  of(segment: Segment, multiplier: Multiplier): Dart {
    if (segment === 'MISS' && multiplier !== 'SIMPLE') {
      throw new DomainError('A missed dart has no multiplier')
    }
    if (segment === 'BULL' && multiplier === 'TRIPLE') {
      throw new DomainError('There is no triple bull on a dartboard')
    }
    if (
      estSegmentNumerote(segment) &&
      (!Number.isInteger(segment) || segment < 1 || segment > 20)
    ) {
      throw new DomainError(`Segment must be between 1 and 20, got ${segment}`)
    }
    return { segment, multiplier }
  },

  single: (segment: SegmentNumber): Dart => Dart.of(segment, 'SIMPLE'),
  double: (segment: SegmentNumber): Dart => Dart.of(segment, 'DOUBLE'),
  triple: (segment: SegmentNumber): Dart => Dart.of(segment, 'TRIPLE'),

  /** 25 points, PAS un double. */
  bull: (): Dart => Dart.of('BULL', 'SIMPLE'),
  /** 50 points, COMPTE comme un double. */
  bullseye: (): Dart => Dart.of('BULL', 'DOUBLE'),
  miss: (): Dart => Dart.of('MISS', 'SIMPLE'),

  points(dart: Dart): number {
    if (dart.segment === 'MISS') return 0
    if (dart.segment === 'BULL') return dart.multiplier === 'DOUBLE' ? 50 : 25
    return dart.segment * MULTIPLIER_FACTOR[dart.multiplier]
  },

  /** Le bullseye (50) est un double : il permet de sortir en `double out`. */
  isDouble(dart: Dart): boolean {
    return dart.segment !== 'MISS' && dart.multiplier === 'DOUBLE'
  },

  /** Notation standard des fléchettes : T20, D16, S5, 25, BULL, 0. */
  label(dart: Dart): string {
    if (dart.segment === 'MISS') return '0'
    if (dart.segment === 'BULL') return dart.multiplier === 'DOUBLE' ? 'BULL' : '25'
    const prefixe = dart.multiplier === 'TRIPLE' ? 'T' : dart.multiplier === 'DOUBLE' ? 'D' : 'S'
    return `${prefixe}${dart.segment}`
  },

  equals: (a: Dart, b: Dart): boolean => a.segment === b.segment && a.multiplier === b.multiplier,
}

/** Toutes les fléchettes marquantes (le « manqué » est exclu). */
export const ALL_SCORING_DARTS: readonly Dart[] = [
  ...SEGMENT_NUMBERS.flatMap((n) => [Dart.single(n), Dart.double(n), Dart.triple(n)]),
  Dart.bull(),
  Dart.bullseye(),
]
