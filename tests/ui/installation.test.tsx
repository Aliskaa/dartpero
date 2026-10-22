import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'
import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import {
  createMemoryPreferences,
  type Preferences,
} from '@/core/application/ports/driven/Preferences'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { CLE_INSTALLATION_ECARTEE } from '@/ui/hooks/useInstallation'
import { FakeAppInstallation, FakePersistentStorage, fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const avec = (
  installation: FakeAppInstallation,
  options: {
    readonly preferences?: Preferences
    readonly stockage?: FakePersistentStorage
  } = {},
) => {
  const base = fakeServices().dependencies
  return fakeServices({
    devices: {
      ...base.devices,
      appInstallation: installation,
      preferences: options.preferences ?? base.devices.preferences,
      persistentStorage: options.stockage ?? base.devices.persistentStorage,
    },
  }).services
}

const invitation = () => screen.queryByRole('region', { name: 'Installer Dartpéro' })

const vider = () => act(async () => {})

describe('Installation — Accueil', () => {
  const ouvrir = (installation: FakeAppInstallation, preferences?: Preferences) =>
    renderWithServices(<AccueilEcran />, {
      services: avec(installation, preferences ? { preferences } : {}),
    })

  it('installable : un bouton « Installer » et un « Plus tard », sans ouvrir l’invite', async () => {
    const installation = new FakeAppInstallation('installable')
    ouvrir(installation)

    const ligne = await screen.findByRole('region', { name: 'Installer Dartpéro' })
    expect(within(ligne).getByRole('button', { name: 'Installer' })).toBeInTheDocument()
    expect(within(ligne).getByRole('button', { name: 'Plus tard' })).toBeInTheDocument()
    expect(installation.promptCalls).toBe(0)
  })

  it.each(['ios-manual', 'ios-other-browser'] as const)(
    '%s : « Installer » mène au guide des Réglages',
    async (etat) => {
      ouvrir(new FakeAppInstallation(etat))

      const ligne = await screen.findByRole('region', { name: 'Installer Dartpéro' })
      expect(within(ligne).getByRole('link', { name: 'Installer' })).toHaveAttribute(
        'href',
        '/reglages#installer',
      )
      expect(within(ligne).queryByRole('button', { name: 'Installer' })).toBeNull()
      expect(within(ligne).getByRole('button', { name: 'Plus tard' })).toBeInTheDocument()
    },
  )

  it.each(['installed', 'unavailable'] as const)('%s : rien sur l’Accueil', async (etat) => {
    ouvrir(new FakeAppInstallation(etat))
    await screen.findByRole('link', { name: 'Nouvelle partie' })

    expect(invitation()).toBeNull()
  })

  it('« Installer » ouvre l’invite une fois ; la ligne disparaît, puis reste absente une fois installée', async () => {
    const installation = new FakeAppInstallation('installable', 'accepted')
    ouvrir(installation)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: 'Installer' }))

    expect(installation.promptCalls).toBe(1)
    expect(invitation()).toBeNull()

    act(() => installation.regler('installed'))
    expect(invitation()).toBeNull()
  })

  it('une invite arrivée après le montage fait apparaître la ligne, sans recharger', async () => {
    const installation = new FakeAppInstallation('unavailable')
    ouvrir(installation)
    await screen.findByRole('link', { name: 'Nouvelle partie' })
    expect(invitation()).toBeNull()

    act(() => installation.regler('installable'))

    expect(invitation()).toBeInTheDocument()
  })

  it('appinstalled pendant que l’Accueil est ouvert : la ligne disparaît', async () => {
    const installation = new FakeAppInstallation('installable')
    ouvrir(installation)
    await screen.findByRole('region', { name: 'Installer Dartpéro' })

    act(() => installation.regler('installed'))

    expect(invitation()).toBeNull()
  })

  it('« Plus tard » masque la ligne, et la garde masquée au remontage', async () => {
    const preferences = createMemoryPreferences()
    const installation = new FakeAppInstallation('installable')
    const { unmount } = ouvrir(installation, preferences)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: 'Plus tard' }))

    expect(invitation()).toBeNull()
    expect(preferences.read(CLE_INSTALLATION_ECARTEE, false)).toBe(true)
    expect(installation.promptCalls).toBe(0)

    unmount()
    ouvrir(installation, preferences)
    await screen.findByRole('link', { name: 'Nouvelle partie' })
    expect(invitation()).toBeNull()
  })

  it('« Plus tard » ne masque que l’Accueil : les Réglages gardent leur entrée', async () => {
    const preferences = createMemoryPreferences()
    preferences.write(CLE_INSTALLATION_ECARTEE, true)
    renderWithServices(<ReglagesEcran />, {
      services: avec(new FakeAppInstallation('installable'), { preferences }),
    })

    expect(await screen.findByRole('status', { name: 'Application' })).toHaveTextContent(
      'Pas installée',
    )
    expect(screen.getByRole('button', { name: 'Installer Dartpéro' })).toBeInTheDocument()
  })

  it('l’App montée en « installable » n’ouvre jamais l’invite d’elle-même', async () => {
    const installation = new FakeAppInstallation('installable')
    renderWithServices(<App />, { services: avec(installation) })
    await screen.findByRole('navigation')
    await vider()

    expect(await screen.findByRole('region', { name: 'Installer Dartpéro' })).toBeInTheDocument()
    expect(installation.promptCalls).toBe(0)
  })

  it('sur iOS, « Installer » mène aux Réglages, sur l’entrée d’installation', async () => {
    renderWithServices(<App />, { services: avec(new FakeAppInstallation('ios-manual')) })
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('link', { name: 'Installer' }))

    expect(await screen.findByRole('heading', { name: 'Réglages' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Installation' })).toHaveTextContent('Safari')
  })

  it('se désabonne au démontage', async () => {
    const installation = new FakeAppInstallation('installable')
    const { unmount } = ouvrir(installation)
    await screen.findByRole('region', { name: 'Installer Dartpéro' })
    expect(installation.abonnements).toBeGreaterThan(0)

    unmount()
    expect(installation.abonnements).toBe(0)
  })
})

describe('Installation — Réglages, voyant Application et guide #installer', () => {
  const ouvrir = (etat: InstallState, route = '/reglages') => {
    const installation = new FakeAppInstallation(etat)
    renderWithServices(<ReglagesEcran />, { services: avec(installation), route })
    return installation
  }

  const voyant = () => screen.findByRole('status', { name: 'Application' })
  const guide = () => screen.queryByRole('status', { name: 'Installation' })
  const comment = () => screen.queryByRole('link', { name: 'Comment ? Installer Dartpéro' })
  const installer = () => screen.queryByRole('button', { name: 'Installer Dartpéro' })

  it.each([
    ['installed', 'Installée', 'aucune'],
    ['installable', 'Pas installée', 'installer'],
    ['ios-manual', 'Pas installée', 'comment'],
    ['ios-other-browser', 'Pas installée', 'comment'],
    ['unavailable', 'Pas installée', 'comment'],
  ] as const)('%s : « %s », action %s', async (etat, valeur, action) => {
    ouvrir(etat)

    expect(await voyant()).toHaveTextContent(valeur)
    expect(installer() !== null).toBe(action === 'installer')
    expect(comment() !== null).toBe(action === 'comment')
    expect(guide() !== null).toBe(action === 'comment')
  })

  it('installable : « Installer » ouvre l’invite une fois, puis cède la place à « Comment ? »', async () => {
    const installation = ouvrir('installable')
    const utilisateur = userEvent.setup()

    await voyant()
    await utilisateur.click(installer() as HTMLElement)

    expect(installation.promptCalls).toBe(1)
    expect(installer()).toBeNull()
    expect(comment()).toBeInTheDocument()
  })

  it('« Comment ? » mène à l’ancre #installer de la même page', async () => {
    ouvrir('ios-manual')
    await voyant()

    expect(comment()).toHaveAttribute('href', '/reglages#installer')
  })

  it('ios-manual : la phrase et les trois gestes en ligne', async () => {
    ouvrir('ios-manual')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent('Safari')
    const bloc = document.getElementById('installer') as HTMLElement
    const etapes = within(within(bloc).getByRole('list')).getAllByRole('listitem')
    expect(etapes).toHaveLength(3)
    expect(etapes[0]).toHaveTextContent('Partager')
    expect(etapes[1]).toHaveTextContent('Sur l’écran d’accueil')
    expect(etapes[2]).toHaveTextContent('Ajouter')
  })

  it('ios-other-browser : « Ouvrez dans Safari », sans gestes', async () => {
    ouvrir('ios-other-browser')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Ouvrez ce lien dans Safari pour installer Dartpéro.',
    )
    const bloc = document.getElementById('installer') as HTMLElement
    expect(within(bloc).queryByRole('list')).toBeNull()
  })

  it('unavailable : la phrase générique du menu du navigateur', async () => {
    ouvrir('unavailable')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Ajouter à l’écran d’accueil',
    )
  })

  it('suit l’état en direct : appinstalled pendant que les Réglages sont ouverts', async () => {
    const installation = ouvrir('installable')
    expect(await voyant()).toHaveTextContent('Pas installée')

    act(() => installation.regler('installed'))

    expect(screen.getByRole('status', { name: 'Application' })).toHaveTextContent('Installée')
    expect(screen.getByRole('status', { name: 'Application' })).not.toHaveTextContent('Pas')
    expect(installer()).toBeNull()
    expect(comment()).toBeNull()
  })

  describe('ancre #installer', () => {
    const original = HTMLElement.prototype.scrollIntoView
    afterEach(() => {
      HTMLElement.prototype.scrollIntoView = original
    })

    it('ne casse rien en jsdom, qui n’implémente pas le défilement', async () => {
      ouvrir('ios-manual', '/reglages#installer')
      expect(await screen.findByRole('status', { name: 'Installation' })).toBeInTheDocument()
    })

    it('fait défiler jusqu’au guide d’installation', async () => {
      const cibles: string[] = []
      HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
        cibles.push(this.id)
      }
      ouvrir('ios-manual', '/reglages#installer')
      await screen.findByRole('status', { name: 'Installation' })

      expect(cibles).toEqual(['installer'])
    })

    it('ne fait rien défiler sans l’ancre', async () => {
      const cibles: string[] = []
      HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
        cibles.push(this.id)
      }
      ouvrir('ios-manual')
      await screen.findByRole('status', { name: 'Installation' })

      expect(cibles).toEqual([])
    })

    it('« Comment ? » fait défiler jusqu’au guide, à chaque appui', async () => {
      const cibles: string[] = []
      HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
        cibles.push(this.id)
      }
      ouvrir('unavailable')
      const utilisateur = userEvent.setup()
      await voyant()

      await utilisateur.click(comment() as HTMLElement)
      await utilisateur.click(comment() as HTMLElement)

      expect(cibles).toEqual(['installer', 'installer'])
    })
  })
})

describe('Installation — après un refus de « Demander la protection »', () => {
  const refuser = async (etat: InstallState) => {
    const installation = new FakeAppInstallation(etat)
    renderWithServices(<ReglagesEcran />, {
      services: avec(installation, {
        stockage: new FakePersistentStorage('not-persisted', { accorde: false }),
      }),
      route: '/reglages',
    })
    const utilisateur = userEvent.setup()
    await utilisateur.click(await screen.findByRole('button', { name: 'Demander la protection' }))
    expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'Le navigateur a refusé.',
    )
    return { installation, utilisateur }
  }

  it('installable : aucun second bouton, le voyant porte l’action', async () => {
    const { installation, utilisateur } = await refuser('installable')

    const boutons = screen.getAllByRole('button', { name: 'Installer Dartpéro' })
    expect(boutons).toHaveLength(1)
    const protection = screen.getByRole('status', { name: 'Protection des données' })
    expect(within(protection).queryByRole('button')).toBeNull()

    await utilisateur.click(boutons[0] as HTMLElement)
    expect(installation.promptCalls).toBe(1)
  })

  it.each(['ios-manual', 'ios-other-browser'] as const)(
    '%s : plus de lien sous la phrase, « Comment ? » seul y mène',
    async (etat) => {
      await refuser(etat)

      expect(screen.queryByRole('link', { name: 'Voir comment installer' })).toBeNull()
      expect(screen.getAllByRole('link', { name: 'Comment ? Installer Dartpéro' })).toHaveLength(1)
    },
  )
})
