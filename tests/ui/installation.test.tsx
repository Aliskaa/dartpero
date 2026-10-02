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

/** Laisse les promesses déjà résolues se dérouler. */
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

    // Le fake compte chaque appel : un second `prompt()` par clic ferait 2.
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

    expect(await screen.findByRole('status', { name: 'Installation' })).toBeInTheDocument()
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

describe('Installation — Réglages → À propos', () => {
  const ouvrir = (etat: InstallState, route = '/reglages') => {
    const installation = new FakeAppInstallation(etat)
    renderWithServices(<ReglagesEcran />, { services: avec(installation), route })
    return installation
  }

  it('installable : la phrase d’état et un bouton qui ouvre l’invite une fois', async () => {
    const installation = ouvrir('installable')
    const utilisateur = userEvent.setup()

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Installez Dartpéro pour l’ouvrir en plein écran',
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Installer Dartpéro' }))

    // Le fake compte chaque appel : un second `prompt()` par clic ferait 2.
    expect(installation.promptCalls).toBe(1)
    // L'invite consommée n'est plus proposée.
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('ios-manual : les trois gestes en ligne', async () => {
    ouvrir('ios-manual')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent('Safari')
    const etapes = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(etapes).toHaveLength(3)
    expect(etapes[0]).toHaveTextContent('Partager')
    expect(etapes[1]).toHaveTextContent('Sur l’écran d’accueil')
    expect(etapes[2]).toHaveTextContent('Ajouter')
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('ios-other-browser : « Ouvrez dans Safari », sans guide ni bouton', async () => {
    ouvrir('ios-other-browser')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Ouvrez ce lien dans Safari pour installer Dartpéro.',
    )
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('installed : « Dartpéro est installé sur cet appareil. »', async () => {
    ouvrir('installed')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Dartpéro est installé sur cet appareil.',
    )
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('unavailable : la phrase générique du menu du navigateur', async () => {
    ouvrir('unavailable')

    expect(await screen.findByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Ajouter à l’écran d’accueil',
    )
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('suit l’état en direct : appinstalled pendant que les Réglages sont ouverts', async () => {
    const installation = ouvrir('installable')
    await screen.findByRole('button', { name: 'Installer Dartpéro' })

    act(() => installation.regler('installed'))

    expect(screen.getByRole('status', { name: 'Installation' })).toHaveTextContent(
      'Dartpéro est installé',
    )
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
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

    it('fait défiler jusqu’à l’entrée d’installation', async () => {
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
  })
})

describe('Installation — après un refus de « Redemander »', () => {
  const refuser = async (etat: InstallState) => {
    const installation = new FakeAppInstallation(etat)
    renderWithServices(<ReglagesEcran />, {
      services: avec(installation, {
        stockage: new FakePersistentStorage('not-persisted', { accorde: false }),
      }),
      route: '/reglages',
    })
    const utilisateur = userEvent.setup()
    await utilisateur.click(await screen.findByRole('button', { name: 'Redemander' }))
    expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'Le navigateur a refusé.',
    )
    return { installation, utilisateur }
  }

  it('installable : un second bouton « Installer Dartpéro », hors de la région live', async () => {
    const { installation, utilisateur } = await refuser('installable')

    const boutons = screen.getAllByRole('button', { name: 'Installer Dartpéro' })
    expect(boutons).toHaveLength(2)
    const protection = screen.getByRole('status', { name: 'Protection des données' })
    expect(within(protection).queryByRole('button')).toBeNull()

    await utilisateur.click(boutons[0] as HTMLElement)
    expect(installation.promptCalls).toBe(1)
  })

  it.each(['ios-manual', 'ios-other-browser'] as const)(
    '%s : un lien vers le guide d’installation',
    async (etat) => {
      await refuser(etat)

      expect(screen.getByRole('link', { name: 'Voir comment installer' })).toHaveAttribute(
        'href',
        '/reglages#installer',
      )
    },
  )

  it.each(['installed', 'unavailable'] as const)('%s : aucune action de plus', async (etat) => {
    await refuser(etat)

    expect(screen.queryByRole('link', { name: 'Voir comment installer' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Installer Dartpéro' })).toBeNull()
  })

  it('aucune action vers l’installation tant qu’il n’y a pas eu de refus', async () => {
    renderWithServices(<ReglagesEcran />, {
      services: avec(new FakeAppInstallation('ios-manual'), {
        stockage: new FakePersistentStorage('not-persisted', { accorde: false }),
      }),
    })
    await screen.findByRole('button', { name: 'Redemander' })

    expect(screen.queryByRole('link', { name: 'Voir comment installer' })).toBeNull()
  })
})
