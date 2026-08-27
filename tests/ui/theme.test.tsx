import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { CLE_THEME } from '@/ui/theme'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

/** L'attribut que toute la feuille de style écoute. */
const themePose = () => document.documentElement.dataset.theme

const barreSysteme = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute('content')

/**
 * `matchMedia` n'existe pas en jsdom. On le remplace par un faux qui répond au
 * réglage demandé **et** qui garde ses abonnés sous la main : c'est la seule
 * façon de rejouer un coucher de soleil.
 */
const faireCommeSiLeSystemeEtait = (systeme: 'clair' | 'sombre') => {
  const abonnes = new Set<() => void>()
  let courant = systeme

  vi.stubGlobal('matchMedia', (requete: string) => ({
    media: requete,
    matches: requete.includes('dark') ? courant === 'sombre' : courant === 'clair',
    addEventListener: (_: string, rappel: () => void) => abonnes.add(rappel),
    removeEventListener: (_: string, rappel: () => void) => abonnes.delete(rappel),
  }))

  return {
    bascule: (vers: 'clair' | 'sombre') => {
      courant = vers
      for (const rappel of abonnes) rappel()
    },
  }
}

const railTheme = async () => {
  await screen.findByRole('heading', { name: 'Réglages' })
  return screen.getByRole('group', { name: 'Affichage' })
}

describe('Thème clair / sombre / système', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    // `index.html` n'est pas chargé en test : on repose la balise qu'il porte.
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#0E1A13')
    document.head.append(meta)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.querySelector('meta[name="theme-color"]')?.remove()
  })

  /**
   * ⚠️ Le défaut est **sombre**, pas « système ». Le cadrage du projet est un
   * garage mal éclairé : ouvrir la mise à jour sur un fond blanc parce que le
   * téléphone est en clair serait un changement que personne n'a demandé.
   */
  it('démarre en sombre, même si le téléphone est en clair', async () => {
    faireCommeSiLeSystemeEtait('clair')
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    const rail = await railTheme()
    expect(within(rail).getByRole('button', { name: 'Sombre' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(themePose()).toBe('sombre')
  })

  it('bascule en clair tout de suite, sans rechargement, et emmène la barre système', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    const rail = await railTheme()
    await utilisateur.click(within(rail).getByRole('button', { name: 'Clair' }))

    expect(themePose()).toBe('clair')
    expect(barreSysteme()).toBe('#E3D9C1')
    expect(dependencies.devices.preferences.read(CLE_THEME, 'sombre')).toBe('clair')
  })

  it('retrouve le choix à la réouverture de l’app', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const premier = renderWithServices(<App />, { services, route: '/reglages' })

    await utilisateur.click(within(await railTheme()).getByRole('button', { name: 'Clair' }))
    premier.unmount()
    document.documentElement.removeAttribute('data-theme')

    renderWithServices(<App />, { services, route: '/reglages' })

    expect(within(await railTheme()).getByRole('button', { name: 'Clair' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(themePose()).toBe('clair')
  })

  it('sous « Système », suit le réglage du téléphone, y compris quand il change en cours de route', async () => {
    const utilisateur = userEvent.setup()
    const systeme = faireCommeSiLeSystemeEtait('clair')
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    await utilisateur.click(within(await railTheme()).getByRole('button', { name: 'Système' }))
    expect(themePose()).toBe('clair')

    // La nuit tombe, le téléphone bascule tout seul : l'app doit suivre.
    systeme.bascule('sombre')
    expect(themePose()).toBe('sombre')
  })

  /**
   * ⚠️ La préférence est RELUE à chaque bascule du système, jamais capturée en
   * état au montage. Sans ça, l'écouteur posé par `App` alors que le réglage
   * valait « Système » rappliquerait ce choix au premier coucher de soleil, et
   * écraserait le « Clair » choisi entre-temps dans les Réglages.
   */
  it('cesse de suivre le système dès qu’un thème est choisi à la main', async () => {
    const utilisateur = userEvent.setup()
    const systeme = faireCommeSiLeSystemeEtait('clair')
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/reglages' })

    const rail = await railTheme()
    await utilisateur.click(within(rail).getByRole('button', { name: 'Système' }))
    await utilisateur.click(within(rail).getByRole('button', { name: 'Clair' }))

    systeme.bascule('sombre')

    expect(themePose()).toBe('clair')
  })
})
