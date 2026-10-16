import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  BarresPodium,
  ClassementPodium,
  type LigneClassement,
} from '@/ui/composants/commun/CartePodium'

const ligne = (id: string, champs: Partial<LigneClassement>): LigneClassement => ({
  id,
  nom: id,
  couleur: 'brique',
  texte: '0',
  largeur: 0,
  enTete: false,
  absente: false,
  ...champs,
})

/** Les morceaux d'une ligne de barre : piste, remplissage, valeur, complément. */
const morceaux = (li: HTMLElement) => {
  const piste = li.children[2] as HTMLElement
  const colonneValeur = li.children[3] as HTMLElement
  return {
    piste,
    remplissage: piste.firstElementChild as HTMLElement,
    valeur: colonneValeur.firstElementChild as HTMLElement,
    complement: (colonneValeur.children[1] as HTMLElement | undefined) ?? null,
  }
}

const grandChiffre = (texte: string) => {
  const trouve = screen.getAllByText(texte)[0] as HTMLElement
  expect(trouve).toHaveClass('text-5xl')
  return trouve
}

/** Toutes les lignes visibles : le cas d'une carte non coupée. */
const classement = (lignes: readonly LigneClassement[], complement?: string) =>
  render(
    <ClassementPodium lignes={lignes} visibles={lignes} {...(complement ? { complement } : {})} />,
  )

describe('ClassementPodium — le rendu', () => {
  it('ex aequo en tête : barres laiton et chiffres laiton-clair ; les autres en craie', () => {
    classement([
      ligne('Kevin', { texte: '64,2', largeur: 1, enTete: true }),
      ligne('Sarah', { texte: '64,2', largeur: 1, enTete: true }),
      ligne('Julien', { texte: '32,1', largeur: 0.5 }),
      ligne('David', { texte: '—', absente: true }),
    ])

    const lignes = screen.getAllByRole('listitem').map(morceaux)
    expect(lignes.map((l) => l.remplissage.style.width)).toEqual(['100%', '100%', '50%', '0%'])
    for (const l of lignes.slice(0, 2)) {
      expect(l.remplissage).toHaveClass('bg-laiton')
      expect(l.valeur).toHaveClass('text-laiton-clair')
    }
    expect(lignes[2]?.remplissage).toHaveClass('bg-craie/72')
    expect(lignes[2]?.valeur).toHaveClass('text-craie')
    // « — » est une information : craie-3, jamais du décor.
    expect(lignes[3]?.valeur).toHaveTextContent('—')
    expect(lignes[3]?.valeur).toHaveClass('text-craie-3')

    expect(grandChiffre('64,2')).toHaveClass('text-laiton-clair')
  })

  it('personne en tête : le grand chiffre passe en craie-vive (Q2)', () => {
    classement([ligne('Kevin', { texte: '0 %' }), ligne('Sarah', { texte: '—', absente: true })])
    const chiffre = grandChiffre('0 %')
    expect(chiffre).toHaveClass('text-craie-vive')
    expect(chiffre).not.toHaveClass('text-laiton-clair')
  })

  it('premier sans occasion : « — » en craie-3, sans complément', () => {
    classement([ligne('Kevin', { texte: '—', absente: true })], 'fl.')
    expect(grandChiffre('—')).toHaveClass('text-craie-3')
    expect(screen.queryByText('fl.')).toBeNull()
  })

  it('les pistes de barre sont muettes au lecteur d’écran (T-M1)', () => {
    classement([ligne('Kevin', { largeur: 1, enTete: true, texte: '3' }), ligne('Sarah', {})])
    const items = screen.getAllByRole('listitem')
    // Témoin : il y a bien une piste par ligne, puis chacune est `aria-hidden`.
    expect(items).toHaveLength(2)
    for (const li of items) {
      const { piste } = morceaux(li)
      expect(piste.querySelector('span')).not.toBeNull()
      expect(piste).toHaveAttribute('aria-hidden', 'true')
    }
    expect(within(items[0] as HTMLElement).getByText('3')).toBeInTheDocument()
  })

  it('n’affiche que les lignes visibles, mais la grande ligne reste le premier du classement', () => {
    const lignes = ['A', 'B', 'C'].map((id) => ligne(id, { texte: id === 'A' ? '9' : '1' }))
    render(<ClassementPodium lignes={lignes} visibles={lignes.slice(0, 2)} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(grandChiffre('9')).toBeInTheDocument()
  })
})

describe('BarresPodium — le complément par ligne (Victoires, R1-Q7)', () => {
  it('« / j » après la valeur, en craie-3, et jamais sur une valeur absente', () => {
    render(
      <BarresPodium
        lignes={[
          ligne('Kevin', { texte: '2', complement: '/ 2', largeur: 1, enTete: true }),
          ligne('Sarah', { texte: '0', complement: '/ 3' }),
          ligne('David', { texte: '—', absente: true, complement: '/ 1' }),
        ]}
      />,
    )
    const lignes = screen.getAllByRole('listitem').map(morceaux)
    expect(lignes.map((l) => l.complement?.textContent ?? null)).toEqual(['/ 2', '/ 3', null])
    expect(lignes[0]?.complement).toHaveClass('text-craie-3')
  })

  it('les pistes ont la même largeur sur toutes les lignes : colonnes fixes (T12)', () => {
    render(
      <BarresPodium
        lignes={[
          ligne('Kevin', { texte: '100', complement: '/ 120' }),
          ligne('Sarah', { texte: '1', complement: '/ 1' }),
        ]}
      />,
    )
    const grilles = screen.getAllByRole('listitem').map((li) => li.className)
    // Une seule grille pour toute la carte, en pixels fixes hors de la piste.
    expect(new Set(grilles).size).toBe(1)
    expect(grilles[0]).toContain('grid-cols-[24px_54px_1fr_72px]')
  })
})
