import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { ALL_SCORING_DARTS, Dart, type SegmentNumber } from '@/core/domain/value-objects/Dart'

describe('Dart', () => {
  it('compte les points des trois multiplicateurs', () => {
    expect(Dart.points(Dart.single(20))).toBe(20)
    expect(Dart.points(Dart.double(20))).toBe(40)
    expect(Dart.points(Dart.triple(20))).toBe(60)
  })

  it('distingue le bull simple (25) du bullseye (50)', () => {
    expect(Dart.points(Dart.bull())).toBe(25)
    expect(Dart.points(Dart.bullseye())).toBe(50)
  })

  it('refuse le triple bull, qui n’existe pas sur une cible', () => {
    expect(() => Dart.of('BULL', 'TRIPLE')).toThrow(DomainError)
  })

  it('refuse un secteur hors 1-20', () => {
    const horsCible = (n: number) => Dart.of(n as SegmentNumber, 'SIMPLE')
    expect(() => horsCible(0)).toThrow(DomainError)
    expect(() => horsCible(21)).toThrow(DomainError)
    expect(() => horsCible(7.5)).toThrow(DomainError)
  })

  it('modélise la fléchette manquée comme un 0, sans multiplicateur', () => {
    expect(Dart.points(Dart.miss())).toBe(0)
    expect(() => Dart.of('MISS', 'DOUBLE')).toThrow(DomainError)
  })

  it('considère le bullseye comme un double (il permet de sortir)', () => {
    expect(Dart.isDouble(Dart.bullseye())).toBe(true)
    expect(Dart.isDouble(Dart.bull())).toBe(false)
    expect(Dart.isDouble(Dart.double(16))).toBe(true)
    expect(Dart.isDouble(Dart.triple(20))).toBe(false)
    expect(Dart.isDouble(Dart.miss())).toBe(false)
  })

  it('utilise la notation standard des fléchettes', () => {
    expect(Dart.label(Dart.triple(20))).toBe('T20')
    expect(Dart.label(Dart.double(16))).toBe('D16')
    expect(Dart.label(Dart.single(5))).toBe('S5')
    expect(Dart.label(Dart.bull())).toBe('25')
    expect(Dart.label(Dart.bullseye())).toBe('BULL')
    expect(Dart.label(Dart.miss())).toBe('0')
  })

  it('énumère les 62 fléchettes marquantes, sans le manqué', () => {
    expect(ALL_SCORING_DARTS).toHaveLength(62)
    expect(ALL_SCORING_DARTS.some((d) => d.segment === 'MISS')).toBe(false)
    expect(Math.max(...ALL_SCORING_DARTS.map(Dart.points))).toBe(60)
  })
})
