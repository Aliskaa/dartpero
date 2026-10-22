import { describe, expect, it } from 'vitest'
import type {
  PlayerProgress,
  ProgressMeasures,
  ProgressPoint,
} from '@/core/domain/games/x01/progress'
import { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import {
  abscisse,
  axeVertical,
  datesSousLaCourbe,
  defilementPourPoint,
  franchitUneAnnee,
  geometrieCourbe,
  indexDepuisPosition,
  indicesVisibles,
  ordonnee,
  PARTIES_VISIBLES,
  pourcentageLargeur,
  referenceDe,
  valeursTracees,
  vueDepuisDefilement,
} from '@/ui/evolution'
import {
  dateEvolution,
  ecartEvolution,
  nomCourbe,
  partieSurTotal,
  valeurEvolution,
} from '@/ui/labels'

const PAS = 280 / 13

const mesures = (
  average3: number,
  first9Average = average3,
  highestVisit = 60,
): ProgressMeasures => ({
  average3,
  first9Average,
  highestVisit,
})

const point = (rang: number, value: ProgressMeasures, trend: ProgressMeasures | null = null) =>
  ({
    matchId: MatchId.of(`m${rang}`),
    createdAt: new Date(2026, 9, rang + 1, 20).getTime(),
    number: rang + 1,
    value,
    trend,
    trendDelta: null,
  }) satisfies ProgressPoint

const courbe = (points: readonly ProgressPoint[]): PlayerProgress => ({
  playerId: PlayerId.of('kevin'),
  points,
  reference: { average3: 42, first9Average: 47 },
})

describe('Évolution — la géométrie de la planche', () => {
  it('jusqu’à 14 parties, la planche : 295 unités, points de 5 à 285, sans défilement', () => {
    expect(PARTIES_VISIBLES).toBe(14)
    const quatorze = geometrieCourbe(14)
    expect(quatorze).toEqual({ parties: 14, pas: PAS, largeurContenu: 295, defile: false })
    expect(abscisse(quatorze, 0)).toBe(5)
    expect(abscisse(quatorze, 13)).toBeCloseTo(285)
    expect(pourcentageLargeur(quatorze)).toBe(100)

    const deux = geometrieCourbe(2)
    expect([abscisse(deux, 0), abscisse(deux, 1)]).toEqual([5, 285])
  })

  it('une seule partie : un carré au centre du tracé', () => {
    const une = geometrieCourbe(1)
    expect(une.pas).toBe(0)
    expect(abscisse(une, 0)).toBe(145)
  })

  it('au-delà de 14 parties, le même pas et un contenu plus large que la fenêtre', () => {
    const quinze = geometrieCourbe(15)
    expect(quinze.defile).toBe(true)
    expect(quinze.pas).toBeCloseTo(PAS)
    expect(quinze.largeurContenu).toBeCloseTo(5 + 14 * PAS + 10)
    expect(pourcentageLargeur(quinze)).toBeCloseTo((100 * (5 + 14 * PAS + 10)) / 295)

    const quatreVingts = geometrieCourbe(80)
    expect(abscisse(quatreVingts, 79)).toBeCloseTo(5 + 79 * PAS)
    expect(quatreVingts.largeurContenu - abscisse(quatreVingts, 79)).toBeCloseTo(10)
  })
})

describe('Évolution — l’appui et le défilement', () => {
  it('la partie la plus proche, comme la planche quand la courbe tient', () => {
    const geometrie = geometrieCourbe(14)
    const a = (position: number, largeurVisible = 295) =>
      indexDepuisPosition(geometrie, { position, defilement: 0, largeurVisible })

    expect(a(5)).toBe(0)
    expect(a(285)).toBe(13)
    expect(a(5 + 6 * PAS + PAS / 3)).toBe(6)
    expect(a(5 + 6 * PAS + (2 * PAS) / 3)).toBe(7)
    expect(a(2 * (5 + 6 * PAS), 590)).toBe(6)
    expect(a(-50)).toBe(0)
    expect(a(10_000)).toBe(13)
  })

  it('compte le défilement : un appui à droite d’une courbe défilée jusqu’au bout lit la dernière', () => {
    const geometrie = geometrieCourbe(30)
    const largeurVisible = 295
    const fin = geometrie.largeurContenu - largeurVisible
    expect(indexDepuisPosition(geometrie, { position: 280, defilement: fin, largeurVisible })).toBe(
      29,
    )
    expect(indexDepuisPosition(geometrie, { position: 5, defilement: 0, largeurVisible })).toBe(0)
    expect(
      indexDepuisPosition(geometrie, { position: 5 + 3 * PAS, defilement: PAS, largeurVisible }),
    ).toBe(4)
  })

  it('une fenêtre sans largeur (jsdom, carte cachée) lit la dernière partie', () => {
    expect(
      indexDepuisPosition(geometrieCourbe(20), { position: 10, defilement: 0, largeurVisible: 0 }),
    ).toBe(19)
    expect(vueDepuisDefilement({ defilement: 0, largeurVisible: 0 })).toBeNull()
  })

  it('la vue, en unités : la fenêtre montre toujours 295 unités', () => {
    expect(vueDepuisDefilement({ defilement: 0, largeurVisible: 295 })).toEqual({
      debut: 0,
      fin: 295,
    })
    expect(vueDepuisDefilement({ defilement: 100, largeurVisible: 590 })).toEqual({
      debut: 50,
      fin: 345,
    })
  })

  it('les parties visibles d’une courbe qui défile, et toutes quand elle tient', () => {
    const geometrie = geometrieCourbe(30)
    expect(indicesVisibles(geometrie, { debut: 0, fin: 295 })).toEqual({ premier: 0, dernier: 13 })
    const fin = geometrie.largeurContenu
    expect(indicesVisibles(geometrie, { debut: fin - 295, fin })).toEqual({
      premier: 16,
      dernier: 29,
    })
    expect(indicesVisibles(geometrieCourbe(14), { debut: 100, fin: 395 })).toEqual({
      premier: 0,
      dernier: 13,
    })
  })

  it('le défilement minimal ramène une partie hors de vue, et rien si elle y est', () => {
    const geometrie = geometrieCourbe(30)
    const largeurVisible = 295
    const fin = geometrie.largeurContenu - largeurVisible
    const pour = (index: number, defilement: number) =>
      defilementPourPoint(geometrie, index, { defilement, largeurVisible })

    expect(pour(29, fin)).toBeNull()
    expect(pour(15, fin)).toBeCloseTo(abscisse(geometrie, 15) - 10)
    expect(pour(0, fin)).toBe(0)
    expect(pour(20, 0)).toBeCloseTo(abscisse(geometrie, 20) + 10 - largeurVisible)
    expect(
      defilementPourPoint(geometrieCourbe(14), 0, { defilement: 0, largeurVisible }),
    ).toBeNull()
  })
})

describe('Évolution — les dates sous la courbe', () => {
  it('quand la courbe tient : la première, celle du milieu ⌊(n − 1) / 2⌋, la dernière', () => {
    expect(datesSousLaCourbe(geometrieCourbe(14), null)).toEqual([
      { index: 0, ancre: 'start' },
      { index: 6, ancre: 'middle' },
      { index: 13, ancre: 'end' },
    ])
    expect(datesSousLaCourbe(geometrieCourbe(3), null)).toEqual([
      { index: 0, ancre: 'start' },
      { index: 1, ancre: 'middle' },
      { index: 2, ancre: 'end' },
    ])
  })

  it('deux parties : la première et la dernière ; une seule : la sienne, centrée', () => {
    expect(datesSousLaCourbe(geometrieCourbe(2), null)).toEqual([
      { index: 0, ancre: 'start' },
      { index: 1, ancre: 'end' },
    ])
    expect(datesSousLaCourbe(geometrieCourbe(1), null)).toEqual([{ index: 0, ancre: 'middle' }])
  })

  it('quand elle défile : début, milieu et fin de la portion visible', () => {
    const geometrie = geometrieCourbe(30)
    const fin = geometrie.largeurContenu
    expect(datesSousLaCourbe(geometrie, { debut: fin - 295, fin })).toEqual([
      { index: 16, ancre: 'start' },
      { index: 22, ancre: 'middle' },
      { index: 29, ancre: 'end' },
    ])
  })

  it('« 21 oct » sans point, l’année seulement si la courbe franchit un changement d’année', () => {
    expect(dateEvolution(new Date(2026, 9, 21, 20).getTime(), false)).toBe('21 oct')
    expect(dateEvolution(new Date(2026, 8, 2, 20).getTime(), false)).toBe('2 sept')
    expect(dateEvolution(new Date(2026, 1, 3, 20).getTime(), false)).toBe('3 févr')
    expect(dateEvolution(new Date(2025, 11, 31, 23).getTime(), true)).toBe('31 déc 2025')

    const octobre = courbe([point(0, mesures(40)), point(20, mesures(41))])
    expect(franchitUneAnnee(octobre.points)).toBe(false)
    const aCheval = courbe([
      { ...point(0, mesures(40)), createdAt: new Date(2025, 11, 30, 20).getTime() },
      { ...point(1, mesures(41)), createdAt: new Date(2026, 0, 2, 20).getTime() },
    ])
    expect(franchitUneAnnee(aCheval.points)).toBe(true)
  })
})

describe('Évolution — l’axe vertical (U7), sur toute la courbe', () => {
  it('les axes de la planche : Moyenne 30-55, First 9 35-60, Meilleure volée 40-200', () => {
    const moy = [38.2, 41.5, 36.8, 43.1, 40.4, 45.0, 42.7, 47.3, 44.9, 46.1, 49.5, 45.8, 48.2, 51.0]
    expect(axeVertical('MOYENNE', moy)).toEqual({
      bas: 30,
      haut: 55,
      pas: 5,
      graduations: [30, 35, 40, 45, 50, 55],
    })
    const f9 = [41, 44, 40, 47, 43, 49, 45, 52, 47, 50, 54, 48, 53, 56]
    expect(axeVertical('FIRST_9', f9)).toMatchObject({ bas: 35, haut: 60, pas: 5 })
    const vol = [60, 85, 81, 100, 66, 100, 95, 140, 100, 134, 140, 100, 180, 140]
    expect(axeVertical('VOLEE', vol)).toEqual({
      bas: 40,
      haut: 200,
      pas: 40,
      graduations: [40, 80, 120, 160, 200],
    })
    expect(axeVertical('MOYENNE', [33.2, 36.1])).toMatchObject({ bas: 25, haut: 40 })
  })

  it('pas doublé au-delà de 6 intervalles', () => {
    expect(axeVertical('MOYENNE', [20, 60])).toMatchObject({ bas: 10, haut: 60, pas: 10 })
    expect(axeVertical('VOLEE', [0, 180])).toMatchObject({ bas: 0, haut: 200, pas: 40 })
    expect(axeVertical('VOLEE', [0, 400])).toMatchObject({ bas: 0, haut: 400, pas: 80 })
  })

  it('une très longue série ne dépend pas de la pile d’appel (pas de Math.max(...))', () => {
    const longue = Array.from({ length: 200_000 }, (_, i) => 30 + (i % 21))
    expect(axeVertical('MOYENNE', longue)).toMatchObject({ bas: 25, haut: 50 })
  })

  it('une valeur non finie ne fait jamais boucler l’axe : elle est ignorée', () => {
    expect(axeVertical('MOYENNE', [Number.NaN, 42])).toMatchObject({ bas: 35, haut: 45, pas: 5 })
    expect(axeVertical('VOLEE', [Number.POSITIVE_INFINITY, 100])).toMatchObject({
      bas: 80,
      haut: 120,
    })
    expect(axeVertical('MOYENNE', [Number.NaN, Number.NEGATIVE_INFINITY])).toMatchObject({
      bas: 0,
      haut: 5,
    })
    const demesure = axeVertical('MOYENNE', [0, Number.MAX_VALUE])
    expect(demesure.graduations.length).toBeLessThanOrEqual(7)
  })
  it('jamais sous zéro, et jamais plat', () => {
    expect(axeVertical('MOYENNE', [0, 3])).toMatchObject({ bas: 0, haut: 5 })
    expect(axeVertical('VOLEE', [120])).toMatchObject({ bas: 120, haut: 160 })
  })

  it('encadre les points, les tendances et la ligne pointillée — pas seulement la portion visible', () => {
    const points = [
      point(0, mesures(30, 31, 100)),
      point(1, mesures(50, 51, 140)),
      point(2, mesures(40, 41, 60), mesures(41, 42, 100)),
    ]
    const progression = courbe(points)
    expect(valeursTracees(progression, 'MOYENNE')).toEqual([30, 50, 40, 41, 42])
    expect(valeursTracees(progression, 'FIRST_9')).toEqual([31, 51, 41, 42, 47])
    expect(valeursTracees(progression, 'VOLEE')).toEqual([100, 140, 60, 100])
    expect(referenceDe(progression, 'VOLEE')).toBeNull()
    expect(referenceDe(courbe(points.slice(0, 2)), 'MOYENNE')).toBeNull()
  })

  it('l’ordonnée : le haut de l’axe à 10, le bas à 166', () => {
    const axe = axeVertical('MOYENNE', [36.8, 51])
    expect(ordonnee(axe, 55)).toBe(10)
    expect(ordonnee(axe, 30)).toBe(166)
  })
})

describe('Évolution — les libellés', () => {
  it('les valeurs : une décimale, ou l’entier pour Meilleure volée', () => {
    expect(valeurEvolution(51, 1)).toBe('51,0')
    expect(valeurEvolution(100.4, 0)).toBe('100')
  })

  it('l’écart signé à la main, « 0 » sans signe quand il s’arrondit à zéro', () => {
    expect(ecartEvolution(12.36, 1)).toBe('+12,4')
    expect(ecartEvolution(-3, 1)).toBe('−3,0')
    expect(ecartEvolution(-0.04, 1)).toBe('0')
    expect(ecartEvolution(0.04, 1)).toBe('0')
    expect(ecartEvolution(26.67, 0)).toBe('+27')
    expect(ecartEvolution(-0.4, 0)).toBe('0')
  })

  it('« Partie N sur M · date » et le nom de la courbe, élision comprise', () => {
    expect(partieSurTotal(14, 14, '21 oct')).toBe('Partie 14 sur 14 · 21 oct')
    expect(nomCourbe('Léo', 14)).toBe('Courbe de Léo, partie par partie')
    expect(nomCourbe('Inès', 2)).toBe('Courbe d’Inès, deux parties')
    expect(nomCourbe('Kevin', 1)).toBe('Courbe de Kevin, une partie')
  })
})
