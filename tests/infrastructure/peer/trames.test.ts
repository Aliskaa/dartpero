import { describe, expect, it } from 'vitest'
import { decouper, Reassembleur, TRAME_UNITES } from '@/infrastructure/peer/trames'

const octets = (texte: string) => new TextEncoder().encode(texte).length

describe('Trames du lien', () => {
  it('un message court tient en une trame', () => {
    expect(decouper('{"a":1}')).toEqual(['F{"a":1}'])
  })

  it('chaque trame reste sous 16 Kio, même en caractères de 3 octets', () => {
    const message = '€'.repeat(TRAME_UNITES * 3 + 7)
    const trames = decouper(message)
    expect(trames).toHaveLength(4)
    for (const trame of trames) expect(octets(trame)).toBeLessThanOrEqual(16 * 1024)
    const r = new Reassembleur()
    const lus = trames.map((t) => r.recevoir(t))
    expect(lus.slice(0, -1)).toEqual([null, null, null])
    expect(lus.at(-1)).toBe(message)
  })

  it('ne coupe jamais une paire de substitution (pseudo avec emoji)', () => {
    const message = `${'a'.repeat(TRAME_UNITES - 1)}🎯${'b'.repeat(10)}`
    const trames = decouper(message)
    expect(trames).toHaveLength(2)
    for (const trame of trames)
      expect(trame).not.toMatch(
        /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/,
      )
    const r = new Reassembleur()
    r.recevoir(trames[0])
    expect(r.recevoir(trames[1])).toBe(message)
  })

  it('un message réassemblé trop gros est jeté entier, le suivant passe', () => {
    const r = new Reassembleur(10)
    expect(r.recevoir('C123456')).toBeNull()
    expect(r.recevoir('F7890123')).toBeNull()
    expect(r.recevoir('Fok')).toBe('ok')
  })

  it('une trame inconnue fait jeter le message en cours', () => {
    const r = new Reassembleur()
    r.recevoir('Cdebut')
    expect(r.recevoir('Xintrus')).toBeNull()
    expect(r.recevoir('Ffin')).toBeNull()
    expect(r.recevoir(42)).toBeNull()
    expect(r.recevoir('Fpropre')).toBeNull()
    expect(r.recevoir('Fpropre')).toBe('propre')
  })
})
