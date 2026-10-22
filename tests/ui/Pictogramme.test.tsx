import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PICTOGRAMMES, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { TRACES_ATTENDUS } from './tracesPictogrammes'

const rendre = (nom: (typeof PICTOGRAMMES)[number], taille: 20 | 24 | 32 | 40 | 64 = 24) => {
  const { container } = render(<Pictogramme nom={nom} taille={taille} className="text-craie" />)
  const svg = container.querySelector('svg')
  if (!svg) throw new Error(`pas de <svg> pour ${nom}`)
  return svg
}

describe('Pictogramme', () => {
  it('compte les quatorze pictogrammes des planches (viseur du Killer et évolution compris)', () => {
    expect(PICTOGRAMMES).toHaveLength(14)
    expect(new Set(PICTOGRAMMES).size).toBe(14)
  })

  it.each(PICTOGRAMMES)('« %s » : un svg décoratif en grille 24, trait vif', (nom) => {
    const svg = rendre(nom)
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('2')
    expect(svg.getAttribute('stroke-linecap')).toBe('square')
    expect(svg.getAttribute('stroke-linejoin')).toBe('miter')
    expect(svg.querySelectorAll('path, circle').length).toBeGreaterThan(0)
  })

  it.each(PICTOGRAMMES)('« %s » : aucune couleur autre que currentColor', (nom) => {
    const svg = rendre(nom)
    const elements = [svg, ...svg.querySelectorAll('*')]
    for (const element of elements) {
      for (const attribut of ['fill', 'stroke']) {
        const valeur = element.getAttribute(attribut)
        if (valeur !== null)
          expect(['none', 'currentColor'], `${nom} ${attribut}`).toContain(valeur)
      }
    }
    expect(svg.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
  })

  it.each(PICTOGRAMMES)('« %s » : le tracé est celui de la planche', (nom) => {
    expect(rendre(nom).innerHTML).toBe(TRACES_ATTENDUS[nom])
  })

  it.each([20, 24, 32, 40, 64] as const)(
    'pose la taille %i px en largeur et en hauteur',
    (taille) => {
      const svg = rendre('victoire', taille)
      expect(svg.getAttribute('width')).toBe(String(taille))
      expect(svg.getAttribute('height')).toBe(String(taille))
    },
  )

  it('laisse la couleur et le rétrécissement à la classe', () => {
    expect(rendre('nul').getAttribute('class')).toBe('text-craie')
  })

  it('refuse à la compilation un nom inconnu et une taille sous 20 px', () => {
    // Jamais exécuté : seul le typage est vérifié (`npm run typecheck`).
    const _refuses = () => (
      <>
        {/* @ts-expect-error nom inconnu */}
        <Pictogramme nom="couronne" taille={24} />
        {/* @ts-expect-error taille hors liste : le plancher est 20 px */}
        <Pictogramme nom="nul" taille={16} />
      </>
    )
    expect(_refuses).toBeTypeOf('function')
  })
})
