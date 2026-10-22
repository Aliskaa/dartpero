import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { CLE_THEME } from '@/ui/theme'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const themePose = () => document.documentElement.dataset.theme

const barreSysteme = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute('content')

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
  return screen.getByRole('group', { name: 'Thème' })
}

describe('Thème clair / sombre / système', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#0E1A13')
    document.head.append(meta)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.querySelector('meta[name="theme-color"]')?.remove()
  })

  // ⚠️ Le défaut est sombre, pas « système » : le cadrage est un garage mal éclairé.
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

    systeme.bascule('sombre')
    expect(themePose()).toBe('sombre')
  })

  // ⚠️ La préférence est relue à chaque bascule du système, jamais capturée au montage.
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
