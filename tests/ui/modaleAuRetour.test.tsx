import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Modale } from '@/ui/composants/commun/Modale'
import { useModaleAuRetour } from '@/ui/hooks/useModaleAuRetour'
import { retourTelephone, SondeHistorique } from './gestes'

const LISTES = ['A', 'B'] as const

const Harnais = () => {
  const { ouverte, ouvrir, fermer } = useModaleAuRetour('liste', LISTES)
  const { pathname } = useLocation()
  return (
    <>
      <output aria-label="Chemin">{pathname}</output>
      <output aria-label="Ouverte">{ouverte ?? 'aucune'}</output>
      <button type="button" onClick={() => ouvrir('A')}>
        Ouvrir
      </button>
      <button
        type="button"
        onClick={() => {
          ouvrir('A')
          ouvrir('B')
        }}
      >
        Ouvrir deux fois
      </button>
      <button type="button" onClick={fermer}>
        Fermer
      </button>
      <button
        type="button"
        onClick={() => {
          fermer()
          fermer()
        }}
      >
        Fermer deux fois
      </button>
    </>
  )
}

type Entree = string | { readonly pathname: string; readonly state: unknown }

const monter = (entrees: readonly Entree[] = ['/avant', '/ici'], strict = false) => {
  const arbre = (
    <MemoryRouter initialEntries={[...entrees]} initialIndex={entrees.length - 1}>
      <Harnais />
      <SondeHistorique />
    </MemoryRouter>
  )
  render(strict ? <StrictMode>{arbre}</StrictMode> : arbre)
  return userEvent.setup()
}

const chemin = () => screen.getByRole('status', { name: 'Chemin' }).textContent
const ouverte = () => screen.getByRole('status', { name: 'Ouverte' }).textContent

describe('useModaleAuRetour — le retour du téléphone ferme la modale', () => {
  it('ouvrir puis retour : fermée, et on reste sur l’écran', async () => {
    const utilisateur = monter()
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(ouverte()).toBe('A')
    expect(chemin()).toBe('/ici')

    await retourTelephone()
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })

  it('ouvrir, fermer, puis retour : on quitte l’écran — aucune entrée orpheline', async () => {
    const utilisateur = monter()
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')

    await retourTelephone()
    expect(chemin()).toBe('/avant')
  })

  it('deux ouvertures dans le même geste n’empilent qu’une entrée', async () => {
    const utilisateur = monter()
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir deux fois' }))
    expect(ouverte()).toBe('A')

    await retourTelephone()
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })

  it('deux fermetures dans le même geste ne reculent qu’une fois', async () => {
    const utilisateur = monter()
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer deux fois' }))
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })

  it.each([{ liste: 'Z' }, { liste: 42 }, 'liste', null, { autre: 'A' }])(
    'un état inconnu (%j) n’ouvre rien',
    (state) => {
      monter(['/avant', { pathname: '/ici', state }])
      expect(ouverte()).toBe('aucune')
    },
  )

  it('après un rechargement, rouverte depuis l’historique ; le retour la ferme (R1-Q9)', async () => {
    const utilisateur = monter(['/avant', '/ici', { pathname: '/ici', state: { liste: 'B' } }])
    expect(ouverte()).toBe('B')
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })
})

describe('useModaleAuRetour — sous StrictMode, tout en haut', () => {
  it('un clic n’empile qu’une entrée, et le retour la dépile', async () => {
    const utilisateur = monter(['/avant', '/ici'], true)
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(ouverte()).toBe('A')

    await retourTelephone()
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')

    await retourTelephone()
    expect(chemin()).toBe('/avant')
  })

  it('rouverte après un rechargement, elle le reste malgré le double montage', async () => {
    const utilisateur = monter(
      ['/avant', '/ici', { pathname: '/ici', state: { liste: 'A' } }],
      true,
    )
    expect(ouverte()).toBe('A')
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(chemin()).toBe('/ici')
    expect(ouverte()).toBe('aucune')
  })
})

describe('useModaleAuRetour — les gardes, geste par geste', () => {
  it('TM-3 : ouvrir une seconde fois, déjà ouverte, n’empile rien — un retour suffit', async () => {
    const utilisateur = monter()
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(ouverte()).toBe('A')

    await retourTelephone()
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })

  it('TM-4 : fermer sans modale ouverte ne recule pas', async () => {
    const utilisateur = monter()
    expect(ouverte()).toBe('aucune')
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(chemin()).toBe('/ici')
  })
})

const HarnaisAvecModale = () => {
  const { ouverte, fermer } = useModaleAuRetour('liste', LISTES)
  const { pathname } = useLocation()
  return (
    <>
      <output aria-label="Chemin">{pathname}</output>
      <output aria-label="Ouverte">{ouverte ?? 'aucune'}</output>
      <Modale ouvert={ouverte !== null} onFermer={fermer} titre="Liste">
        <p>Contenu</p>
      </Modale>
    </>
  )
}

describe('useModaleAuRetour + Modale — sous StrictMode, tout en haut (piège 6)', () => {
  it('TM-1 : rouverte après un rechargement, elle reste ouverte malgré le double montage ; ✕ la ferme', async () => {
    render(
      <StrictMode>
        <MemoryRouter
          initialEntries={['/avant', '/ici', { pathname: '/ici', state: { liste: 'A' } }]}
          initialIndex={2}
        >
          <HarnaisAvecModale />
          <SondeHistorique />
        </MemoryRouter>
      </StrictMode>,
    )

    expect(screen.getByRole('dialog', { name: 'Liste' })).toBeInTheDocument()
    expect(ouverte()).toBe('A')
    expect(chemin()).toBe('/ici')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(ouverte()).toBe('aucune')
    expect(chemin()).toBe('/ici')
  })
})
