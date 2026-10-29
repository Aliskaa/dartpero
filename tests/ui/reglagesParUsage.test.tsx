import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Dependencies } from '@/composition/container'
import { createMemoryPreferences } from '@/core/application/ports/driven/Preferences'
import { X01Config } from '@/core/domain/games/x01/config'
import { InMemoryMatchRepository } from '@/infrastructure/memory/InMemoryMatchRepository'
import { InMemoryPlayerRepository } from '@/infrastructure/memory/InMemoryPlayerRepository'
import { CLE_CONTENU_APPAREIL } from '@/ui/clesRequetes'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { CLE_DERNIER_EXPORT, CLE_VOIX } from '@/ui/hooks/useAppareil'
import { FakeAppInstallation, FakePersistentStorage, fakeServices, SettableClock } from '../fakes'
import { renderWithServices } from './renderWithServices'

const MAINTENANT = new Date(2026, 9, 17, 12).getTime()
const ilYA = (jours: number) => new Date(2026, 9, 17 - jours, 12).getTime()

const ouvrir = (surcharges: Partial<Dependencies> = {}, queryClient?: QueryClient) => {
  const base = fakeServices().dependencies
  const { services, dependencies } = fakeServices({
    clock: new SettableClock(MAINTENANT),
    ...surcharges,
    devices: {
      ...base.devices,
      persistentStorage: new FakePersistentStorage('persisted'),
      ...surcharges.devices,
    },
  })
  renderWithServices(<ReglagesEcran />, {
    services,
    route: '/reglages',
    ...(queryClient && { queryClient }),
  })
  return { services, dependencies }
}

const telechargementPossible = () => {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static override createObjectURL = () => 'blob:x'
      static override revokeObjectURL = () => {}
    },
  )
}

const telechargementImpossible = () => {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static override createObjectURL = (): string => {
        throw new Error('quota dépassé')
      }
      static override revokeObjectURL = () => {}
    },
  )
}

const voyantSauvegarde = () => screen.findByRole('status', { name: 'Dernier export' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Réglages — une page rangée par usage', () => {
  it('dans l’ordre : voyants, contenu, Affichage, Sauvegarde, Joueurs et appli, pied de page', async () => {
    ouvrir()

    const sauvegarde = await voyantSauvegarde()
    const application = screen.getByRole('status', { name: 'Application' })
    const contenu = await screen.findByRole('status', { name: 'Contenu de ce téléphone' })
    const affichage = screen.getByRole('region', { name: 'Affichage' })
    const sauvegardes = screen.getByRole('region', { name: 'Sauvegarde' })
    const joueurs = screen.getByRole('region', { name: 'Joueurs et appli' })
    const pied = screen.getByText('100 % local, hors ligne, sans compte.')
    const presentation = screen.getByText(/compteur de fléchettes/)

    const ordre = [
      sauvegarde,
      application,
      contenu,
      affichage,
      sauvegardes,
      joueurs,
      pied,
      presentation,
    ]
    for (let rang = 1; rang < ordre.length; rang += 1) {
      const avant = ordre[rang - 1] as HTMLElement
      const apres = ordre[rang] as HTMLElement
      expect(avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  const suit = (avant: Element, apres: Element) =>
    Boolean(avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING)

  it('le guide #installer se place entre la ligne de contenu et Affichage (U5)', async () => {
    const base = fakeServices().dependencies
    ouvrir({
      devices: { ...base.devices, appInstallation: new FakeAppInstallation('unavailable') },
    })

    const contenu = await screen.findByRole('status', { name: 'Contenu de ce téléphone' })
    const guide = screen.getByRole('status', { name: 'Installation' })
    const affichage = screen.getByRole('region', { name: 'Affichage' })
    expect(suit(contenu, guide)).toBe(true)
    expect(suit(guide, affichage)).toBe(true)
  })

  it('Sauvegarde dans l’ordre U8f : duo, phrase, explication, puis erreur', async () => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = (): string => {
          throw new Error('quota dépassé')
        }
        static override revokeObjectURL = () => {}
      },
    )
    ouvrir()
    const utilisateur = userEvent.setup()

    const protection = await screen.findByRole('status', { name: 'Protection des données' })
    const restaurer = screen.getByRole('button', { name: 'Restaurer' })
    const explication = screen.getByText(/la base : les profils et parties du fichier/)
    await utilisateur.click(screen.getByRole('button', { name: 'Exporter' }))
    const erreur = await screen.findByRole('alert')

    expect(suit(restaurer, protection)).toBe(true)
    expect(suit(protection, explication)).toBe(true)
    expect(suit(explication, erreur)).toBe(true)
  })

  it('exactement deux voyants, côte à côte', async () => {
    ouvrir()

    const sauvegarde = (await voyantSauvegarde()).parentElement as HTMLElement
    const application = screen.getByRole('status', { name: 'Application' })
      .parentElement as HTMLElement
    const rangee = sauvegarde.parentElement as HTMLElement
    expect(application.parentElement).toBe(rangee)
    expect(rangee.children).toHaveLength(2)
  })

  it('le titre « Réglages », sans sous-titre', async () => {
    ouvrir()

    const titre = await screen.findByRole('heading', { level: 1, name: 'Réglages' })
    expect(titre.parentElement?.querySelector('p')).toBeNull()
  })

  it('les quatre groupes des planches (Écran miroir au-dessus de Sauvegarde), et aucun autre', async () => {
    ouvrir()
    await voyantSauvegarde()

    expect(screen.getAllByRole('heading', { level: 2 }).map((titre) => titre.textContent)).toEqual([
      'Affichage',
      'Écran miroir',
      'Sauvegarde',
      'Joueurs et appli',
    ])
  })
})

describe('Réglages — voyant « Dernier export »', () => {
  it('« Jamais » sans export, en laiton', async () => {
    ouvrir()

    const voyant = await voyantSauvegarde()
    expect(voyant).toHaveTextContent('Jamais')
    expect(voyant).toHaveClass('text-laiton-clair')
  })

  it('« Aujourd’hui » juste après un export réussi, sans rechargement', async () => {
    telechargementPossible()
    const { dependencies } = ouvrir()
    const utilisateur = userEvent.setup()
    await voyantSauvegarde()

    await utilisateur.click(screen.getByRole('button', { name: 'Exporter' }))

    expect(await voyantSauvegarde()).toHaveTextContent('Aujourd’hui')
    expect(dependencies.devices.preferences.read(CLE_DERNIER_EXPORT, null)).toBe(MAINTENANT)
  })

  it('l’action « Exporter » du voyant lance l’export comme le bouton', async () => {
    telechargementPossible()
    const { dependencies } = ouvrir()
    const utilisateur = userEvent.setup()
    await voyantSauvegarde()

    await utilisateur.click(screen.getByRole('button', { name: 'Exporter une sauvegarde' }))

    expect(await voyantSauvegarde()).toHaveTextContent('Aujourd’hui')
    expect(dependencies.devices.preferences.read(CLE_DERNIER_EXPORT, null)).toBe(MAINTENANT)
  })

  it('pendant un export, l’action « Exporter » du voyant est désactivée', async () => {
    telechargementPossible()
    let liberer: () => void = () => {}
    class DepotLent extends InMemoryMatchRepository {
      override async listAll() {
        await new Promise<void>((resoudre) => {
          liberer = resoudre
        })
        return super.listAll()
      }
    }
    ouvrir({ matches: new DepotLent() })
    const utilisateur = userEvent.setup()
    await voyantSauvegarde()
    await act(async () => liberer())

    await utilisateur.click(screen.getByRole('button', { name: 'Exporter' }))

    expect(screen.getByRole('button', { name: 'Exporter une sauvegarde' })).toBeDisabled()
    await act(async () => liberer())
    expect(await voyantSauvegarde()).toHaveTextContent('Aujourd’hui')
    expect(screen.getByRole('button', { name: 'Exporter une sauvegarde' })).toBeEnabled()
  })

  it('un export qui échoue au téléchargement n’écrit pas la date', async () => {
    telechargementImpossible()
    const { dependencies } = ouvrir()
    const utilisateur = userEvent.setup()
    await voyantSauvegarde()

    await utilisateur.click(screen.getByRole('button', { name: 'Exporter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La sauvegarde n’a pas pu être créée.',
    )
    expect(screen.getByRole('status', { name: 'Dernier export' })).toHaveTextContent('Jamais')
    expect(dependencies.devices.preferences.read(CLE_DERNIER_EXPORT, null)).toBeNull()
  })

  it('un export qui échoue à la lecture de la base n’écrit pas la date', async () => {
    telechargementPossible()
    class DepotEnPanne extends InMemoryMatchRepository {
      override async listAll(): Promise<never> {
        throw new Error('IndexedDB indisponible')
      }
    }
    const { dependencies } = ouvrir({ matches: new DepotEnPanne() })
    const utilisateur = userEvent.setup()
    await voyantSauvegarde()

    await utilisateur.click(screen.getByRole('button', { name: 'Exporter' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(dependencies.devices.preferences.read(CLE_DERNIER_EXPORT, null)).toBeNull()
  })

  it('une restauration ne touche pas la date', async () => {
    const ailleurs = fakeServices().services
    await ailleurs.managePlayers.create('Kevin')
    const sauvegarde = await ailleurs.manageBackup.exportAll()

    const preferences = createMemoryPreferences()
    preferences.write(CLE_DERNIER_EXPORT, ilYA(34))
    const base = fakeServices().dependencies
    ouvrir({ devices: { ...base.devices, preferences } })
    const utilisateur = userEvent.setup()
    expect(await voyantSauvegarde()).toHaveTextContent('Il y a 34 jours')

    const fichier = new File([JSON.stringify(sauvegarde)], 'dartpero.json', {
      type: 'application/json',
    })
    await utilisateur.upload(screen.getByLabelText('Fichier de sauvegarde'), fichier)

    expect(await screen.findByText('Sauvegarde restaurée')).toBeInTheDocument()
    expect(preferences.read(CLE_DERNIER_EXPORT, null)).toBe(ilYA(34))
    expect(screen.getByRole('status', { name: 'Dernier export' })).toHaveTextContent(
      'Il y a 34 jours',
    )
  })

  it.each([
    [0, 'Aujourd’hui', false],
    [1, 'Hier', false],
    [30, 'Il y a 30 jours', false],
    [31, 'Il y a 31 jours', true],
    [59, 'Il y a 59 jours', true],
    [60, 'Il y a 2 mois', true],
  ] as const)('à %i jours : « %s », laiton %s', async (jours, texte, laiton) => {
    const preferences = createMemoryPreferences()
    preferences.write(CLE_DERNIER_EXPORT, ilYA(jours))
    const base = fakeServices().dependencies
    ouvrir({ devices: { ...base.devices, preferences } })

    const voyant = await voyantSauvegarde()
    expect(voyant).toHaveTextContent(texte)
    expect(voyant.classList.contains('text-laiton-clair')).toBe(laiton)
  })

  it.each([['texte'], [Number.NaN], [{ jour: 3 }], [true], [1e20]])(
    'une valeur illisible (%o) vaut « Jamais », jamais affichée brute',
    async (valeur) => {
      const preferences = createMemoryPreferences()
      preferences.write(CLE_DERNIER_EXPORT, valeur)
      const base = fakeServices().dependencies
      ouvrir({ devices: { ...base.devices, preferences } })

      const voyant = await voyantSauvegarde()
      expect(voyant).toHaveTextContent('Jamais')
      expect(voyant).toHaveClass('text-laiton-clair')
      expect(voyant.parentElement).toHaveClass('border-laiton')
    },
  )
})

describe('Réglages — filet et encre des voyants', () => {
  const avecExport = (jours: number | null) => {
    const preferences = createMemoryPreferences()
    if (jours !== null) preferences.write(CLE_DERNIER_EXPORT, ilYA(jours))
    const base = fakeServices().dependencies
    ouvrir({ devices: { ...base.devices, preferences } })
  }

  it.each([
    [null, 'border-laiton', 'text-laiton-clair'],
    [30, 'border-vert-cible', 'text-craie-vive'],
    [31, 'border-laiton', 'text-laiton-clair'],
  ] as const)(
    'dernier export il y a %s jours : filet %s, valeur %s',
    async (jours, filet, encre) => {
      avecExport(jours)

      const valeur = await voyantSauvegarde()
      expect(valeur).toHaveClass(encre)
      expect(valeur.parentElement).toHaveClass(filet)
    },
  )

  it.each([
    ['installed', 'border-vert-cible', 'text-vert-etat'],
    ['installable', 'border-laiton', 'text-craie-vive'],
  ] as const)('Application %s : filet %s, valeur %s', async (etat, filet, encre) => {
    const base = fakeServices().dependencies
    ouvrir({ devices: { ...base.devices, appInstallation: new FakeAppInstallation(etat) } })

    const valeur = await screen.findByRole('status', { name: 'Application' })
    expect(valeur).toHaveClass(encre)
    expect(valeur.parentElement).toHaveClass(filet)
  })
})

describe('Réglages — ligne de contenu et « Gérer les joueurs »', () => {
  const contenu = () => screen.findByRole('status', { name: 'Contenu de ce téléphone' })
  const gerer = () => screen.getByRole('link', { name: /Gérer les joueurs/ })

  it('base vide : « 0 partie · 0 joueur », et « 0 » profil', async () => {
    ouvrir()

    expect(await contenu()).toHaveTextContent('0 partie · 0 joueur sur ce téléphone.')
    expect(gerer()).toHaveTextContent('0')
  })

  it('accords au singulier, puis au pluriel', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await services.startMatch.execute({ playerIds: [kevin.id], config: X01Config.create() })

    renderWithServices(<ReglagesEcran />, { services })
    expect(await contenu()).toHaveTextContent('1 partie · 1 joueur sur ce téléphone.')
  })

  it('compte toutes les parties et tous les profils', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    await services.managePlayers.create('David')
    for (let rang = 0; rang < 3; rang += 1) {
      await services.startMatch.execute({
        playerIds: [kevin.id, julien.id],
        config: X01Config.create(),
      })
    }

    renderWithServices(<ReglagesEcran />, { services })
    expect(await contenu()).toHaveTextContent('3 parties · 3 joueurs sur ce téléphone.')
    expect(gerer()).toHaveTextContent('Renommer, couleur, supprimer3')
  })

  it('en échec de lecture : ni ligne ni valeur, jamais un faux « 0 »', async () => {
    class DepotJoueursEnPanne extends InMemoryPlayerRepository {
      override async listAll(): Promise<never> {
        throw new Error('IndexedDB indisponible')
      }
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    ouvrir({ players: new DepotJoueursEnPanne() }, client)
    await voyantSauvegarde()

    await waitFor(() => expect(client.getQueryState(CLE_CONTENU_APPAREIL)?.status).toBe('error'))
    await act(async () => {
      await new Promise((resoudre) => setTimeout(resoudre, 0))
    })

    expect(screen.queryByRole('status', { name: 'Contenu de ce téléphone' })).toBeNull()
    expect(gerer()).not.toHaveTextContent(/\d/)
  })

  it('en chargement : ni ligne ni valeur, puis le compte arrive', async () => {
    let liberer: () => void = () => {}
    class DepotJoueursLent extends InMemoryPlayerRepository {
      override async listAll() {
        await new Promise<void>((resoudre) => {
          liberer = resoudre
        })
        return super.listAll()
      }
    }
    ouvrir({ players: new DepotJoueursLent() })
    await voyantSauvegarde()

    expect(screen.queryByRole('status', { name: 'Contenu de ce téléphone' })).toBeNull()
    expect(gerer()).not.toHaveTextContent(/\d/)

    await act(async () => liberer())
    expect(await contenu()).toHaveTextContent('0 partie · 0 joueur sur ce téléphone.')
  })

  it('après une restauration, la ligne suit sans quitter l’écran, sous le résumé', async () => {
    const ailleurs = fakeServices().services
    await ailleurs.managePlayers.create('Kevin')
    const sauvegarde = await ailleurs.manageBackup.exportAll()
    ouvrir()
    const utilisateur = userEvent.setup()
    expect(await contenu()).toHaveTextContent('0 partie · 0 joueur sur ce téléphone.')

    const fichier = new File([JSON.stringify(sauvegarde)], 'dartpero.json', {
      type: 'application/json',
    })
    await utilisateur.upload(screen.getByLabelText('Fichier de sauvegarde'), fichier)

    const resume = await screen.findByText('Sauvegarde restaurée')
    await waitFor(async () =>
      expect(await contenu()).toHaveTextContent('0 partie · 1 joueur sur ce téléphone.'),
    )
    expect(gerer()).toHaveTextContent('1')
    const explication = screen.getByText(/la base : les profils et parties du fichier/)
    expect(
      explication.compareDocumentPosition(resume) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

describe('Réglages — Affichage', () => {
  it('trois vignettes, la sombre enfoncée par défaut', async () => {
    ouvrir()

    const groupe = await screen.findByRole('group', { name: 'Thème' })
    const vignettes = within(groupe).getAllByRole('button')
    expect(vignettes.map((vignette) => vignette.textContent)).toEqual([
      'Sombre',
      'Clair',
      'Système',
    ])
    expect(vignettes.map((vignette) => vignette.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ])
  })

  it('« Annoncer les volées » est une bascule, « Essayer la voix » grisée quand la voix est coupée', async () => {
    const { dependencies } = ouvrir()
    const utilisateur = userEvent.setup()

    const bascule = await screen.findByRole('button', { name: /Annoncer les volées/ })
    expect(bascule).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Essayer la voix' })).toBeEnabled()

    await utilisateur.click(bascule)

    expect(bascule).toHaveAttribute('aria-pressed', 'false')
    expect(dependencies.devices.preferences.read(CLE_VOIX, true)).toBe(false)
    expect(screen.getByRole('button', { name: 'Essayer la voix' })).toBeDisabled()
  })

  it('chaque ligne, chaque bouton et chaque vignette est une cible d’au moins 48 px (classes)', async () => {
    ouvrir()
    await voyantSauvegarde()

    const vignettes = within(screen.getByRole('group', { name: 'Thème' })).getAllByRole('button')
    expect(vignettes).toHaveLength(3)
    for (const vignette of vignettes) {
      expect(vignette.firstElementChild).toHaveClass('h-13.5')
    }

    for (const ligne of [
      screen.getByRole('button', { name: /Annoncer les volées/ }),
      screen.getByRole('button', { name: 'Essayer la voix' }),
      screen.getByRole('link', { name: /Gérer les joueurs/ }),
      screen.getByRole('link', { name: 'Confidentialité et mentions légales' }),
    ]) {
      expect(ligne).toHaveClass('min-h-14')
    }
    for (const bouton of [
      screen.getByRole('button', { name: 'Exporter' }),
      screen.getByRole('button', { name: 'Restaurer' }),
    ]) {
      expect(bouton).toHaveClass('min-h-14')
    }
  })
})
