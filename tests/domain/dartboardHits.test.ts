import { describe, expect, it } from 'vitest'
import { DartboardHits } from '@/core/domain/services/dartboardHits'
import { ALL_SCORING_DARTS, Dart } from '@/core/domain/value-objects/Dart'

/** Raccourci de lecture : combien de fois telle case a été touchée. */
const sur = (hits: ReturnType<typeof DartboardHits.of>, dart: Dart): number =>
  hits.zones.find((zone) => zone.segment === dart.segment && zone.multiplier === dart.multiplier)
    ?.hits ?? 0

describe('Carte des impacts', () => {
  it('couvre les 62 cases marquantes du plateau, touchées ou non', () => {
    const vide = DartboardHits.empty()

    expect(vide.zones).toHaveLength(ALL_SCORING_DARTS.length)
    expect(vide.zones).toHaveLength(62)
    expect(vide.total).toBe(0)
    expect(vide.busiest).toBe(0)
  })

  it('sépare le simple, le double et le triple d’un même secteur', () => {
    const hits = DartboardHits.of([
      Dart.triple(20),
      Dart.triple(20),
      Dart.single(20),
      Dart.double(20),
    ])

    expect(sur(hits, Dart.triple(20))).toBe(2)
    expect(sur(hits, Dart.single(20))).toBe(1)
    expect(sur(hits, Dart.double(20))).toBe(1)
    expect(hits.total).toBe(4)
    expect(hits.busiest).toBe(2)
  })

  it('distingue l’anneau à 25 du bullseye', () => {
    const hits = DartboardHits.of([Dart.bull(), Dart.bullseye(), Dart.bullseye()])

    expect(sur(hits, Dart.bull())).toBe(1)
    expect(sur(hits, Dart.bullseye())).toBe(2)
  })

  it('compte la fléchette hors cible sans lui inventer de case', () => {
    const hits = DartboardHits.of([Dart.miss(), Dart.miss(), Dart.single(1)])

    expect(hits.missed).toBe(2)
    expect(hits.total).toBe(3)
    expect(hits.busiest).toBe(1)
    expect(hits.zones.reduce((somme, zone) => somme + zone.hits, 0)).toBe(1)
  })

  it('additionne deux cartes sans en perdre une fléchette', () => {
    const soir = DartboardHits.of([Dart.triple(20), Dart.miss()])
    const lendemain = DartboardHits.of([Dart.triple(20), Dart.single(5)])

    const cumul = DartboardHits.merge(soir, lendemain)

    expect(sur(cumul, Dart.triple(20))).toBe(2)
    expect(sur(cumul, Dart.single(5))).toBe(1)
    expect(cumul.missed).toBe(1)
    expect(cumul.total).toBe(4)
    expect(cumul.busiest).toBe(2)
  })

  it('classe les cases les plus touchées et ignore celles qu’on n’a jamais vues', () => {
    const hits = DartboardHits.of([
      Dart.single(5),
      Dart.triple(20),
      Dart.triple(20),
      Dart.triple(20),
      Dart.double(16),
      Dart.double(16),
    ])

    expect(DartboardHits.top(hits, 3).map((zone) => [Dart.label(zone), zone.hits])).toEqual([
      ['T20', 3],
      ['D16', 2],
      ['S5', 1],
    ])
    expect(DartboardHits.top(hits, 10)).toHaveLength(3)
  })

  it('départage deux cases à égalité par ce qu’elles valent', () => {
    const hits = DartboardHits.of([
      Dart.single(1),
      Dart.single(1),
      Dart.triple(20),
      Dart.triple(20),
      Dart.double(10),
      Dart.double(10),
    ])

    expect(DartboardHits.top(hits, 3).map((zone) => Dart.label(zone))).toEqual(['T20', 'D10', 'S1'])
  })

  it('ne modifie pas la carte quand on la classe', () => {
    const hits = DartboardHits.of([Dart.single(19), Dart.triple(20), Dart.triple(20)])
    const avant = hits.zones.map((zone) => Dart.label(zone))

    DartboardHits.top(hits, 3)

    expect(hits.zones.map((zone) => Dart.label(zone))).toEqual(avant)
  })
})
