import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompteBatons } from '@/ui/composants/commun/CompteBatons'

const dessiner = (nombre: number) => {
  const { container } = render(<CompteBatons nombre={nombre} teinte="text-craie" />)
  const groupes = [...container.querySelectorAll('svg')]
  return {
    container,
    groupes,
    /** Le nombre de traits verticaux de chaque groupe, et s'il est barré. */
    forme: groupes.map((svg) => {
      const lignes = [...svg.querySelectorAll('line')]
      const barre = lignes.some((ligne) => ligne.getAttribute('y1') !== '1')
      return { traits: lignes.length - (barre ? 1 : 0), barre }
    }),
  }
}

describe('CompteBatons — les bâtons de craie', () => {
  it('49 : neuf groupes barrés puis quatre traits, et le nombre écrit', () => {
    const { forme, container } = dessiner(49)
    expect(forme).toHaveLength(10)
    expect(forme.slice(0, 9).every((g) => g.traits === 4 && g.barre)).toBe(true)
    expect(forme[9]).toEqual({ traits: 4, barre: false })
    expect(container).toHaveTextContent('49')
  })

  it('50 : dix groupes pleins, rien après', () => {
    const { forme, container } = dessiner(50)
    expect(forme).toHaveLength(10)
    expect(forme.every((g) => g.traits === 4 && g.barre)).toBe(true)
    expect(container).toHaveTextContent('50')
  })

  it.each([51, 312])('%i : plafonné à dix groupes, le nombre exact écrit après', (n) => {
    const { forme, container } = dessiner(n)
    expect(forme).toHaveLength(10)
    expect(forme.every((g) => g.traits === 4 && g.barre)).toBe(true)
    expect(container).toHaveTextContent(String(n))
  })

  it('3 : un groupe de trois traits, non barré', () => {
    expect(dessiner(3).forme).toEqual([{ traits: 3, barre: false }])
  })

  it('0 : un « — », sans aucun bâton', () => {
    const { groupes, container } = dessiner(0)
    expect(groupes).toHaveLength(0)
    expect(container).toHaveTextContent('—')
  })

  it('les bâtons sont muets : seul le nombre se lit', () => {
    const { groupes } = dessiner(12)
    expect(groupes.length).toBeGreaterThan(0)
    for (const svg of groupes) expect(svg.getAttribute('aria-hidden')).toBe('true')
  })
})
