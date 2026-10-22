import { ALL_SCORING_DARTS, Dart, type Multiplier, type Segment } from '../value-objects/Dart'

// Module transverse : il ne connaît que des fléchettes, aucun mode.

/** Une case du plateau : un secteur ET l'anneau touché. */
export type DartboardZone = {
  readonly segment: Segment
  readonly multiplier: Multiplier
  readonly hits: number
}

export type DartboardHits = {
  /** Manquées comprises. */
  readonly total: number
  /** Hors cible : lancée mais sans case. */
  readonly missed: number
  /** Touches de la case la plus touchée : l'échelle de la carte de chaleur. */
  readonly busiest: number
  /** Les 62 cases marquantes, dans l'ordre de `ALL_SCORING_DARTS`. */
  readonly zones: readonly DartboardZone[]
}

const cle = (segment: Segment, multiplier: Multiplier): string => `${segment}:${multiplier}`

const INDEX: ReadonlyMap<string, number> = new Map(
  ALL_SCORING_DARTS.map((dart, rang) => [cle(dart.segment, dart.multiplier), rang]),
)

const assembler = (compteurs: readonly number[], missed: number): DartboardHits => {
  const zones = ALL_SCORING_DARTS.map((dart, rang) => ({
    segment: dart.segment,
    multiplier: dart.multiplier,
    hits: compteurs[rang] ?? 0,
  }))

  return {
    total: compteurs.reduce((somme, valeur) => somme + valeur, 0) + missed,
    missed,
    busiest: zones.reduce((maximum, zone) => Math.max(maximum, zone.hits), 0),
    zones,
  }
}

export const DartboardHits = {
  empty: (): DartboardHits =>
    assembler(
      ALL_SCORING_DARTS.map(() => 0),
      0,
    ),

  of: (darts: Iterable<Dart>): DartboardHits => {
    const compteurs = ALL_SCORING_DARTS.map(() => 0)
    let missed = 0

    for (const dart of darts) {
      const rang = INDEX.get(cle(dart.segment, dart.multiplier))
      if (rang === undefined) missed += 1
      else compteurs[rang] = (compteurs[rang] ?? 0) + 1
    }

    return assembler(compteurs, missed)
  },

  merge: (a: DartboardHits, b: DartboardHits): DartboardHits =>
    assembler(
      a.zones.map((zone, rang) => zone.hits + (b.zones[rang]?.hits ?? 0)),
      a.missed + b.missed,
    ),

  /** Cases touchées, de la plus chaude à la plus froide. ⚠️ À égalité, la case qui vaut le plus passe devant. */
  top: (hits: DartboardHits, limite: number): readonly DartboardZone[] =>
    hits.zones
      .filter((zone) => zone.hits > 0)
      .sort((a, b) => b.hits - a.hits || Dart.points(b) - Dart.points(a))
      .slice(0, limite),
}
