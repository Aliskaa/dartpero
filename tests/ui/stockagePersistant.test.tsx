import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import { FakeAppInstallation, FakePersistentStorage, fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const avecStockage = (stockage: FakePersistentStorage) => {
  const base = fakeServices().dependencies
  return fakeServices({ devices: { ...base.devices, persistentStorage: stockage } }).services
}

const vider = () => act(async () => {})

describe('Stockage persistant — demande au démarrage', () => {
  it('ne redemande pas quand la base est déjà protégée', async () => {
    const stockage = new FakePersistentStorage('persisted')
    renderWithServices(<App />, { services: avecStockage(stockage) })
    await screen.findByRole('navigation')
    await vider()

    expect(stockage.statusCalls).toBe(1)
    expect(stockage.requestCalls).toBe(0)
  })

  it('demande une seule fois quand elle ne l’est pas', async () => {
    const stockage = new FakePersistentStorage('not-persisted')
    renderWithServices(<App />, { services: avecStockage(stockage) })
    await screen.findByRole('navigation')
    await vider()

    expect(stockage.requestCalls).toBe(1)
  })

  it('demande une seule fois même sous StrictMode, qui rejoue les effets', async () => {
    const stockage = new FakePersistentStorage('not-persisted')
    render(
      <StrictMode>
        <QueryClientProvider client={new QueryClient()}>
          <ServicesProvider services={avecStockage(stockage)}>
            <MemoryRouter>
              <App />
            </MemoryRouter>
          </ServicesProvider>
        </QueryClientProvider>
      </StrictMode>,
    )
    await screen.findByRole('navigation')
    await vider()

    expect(stockage.statusCalls).toBe(1)
    expect(stockage.requestCalls).toBe(1)
  })

  it('n’attend pas la demande : l’app s’affiche même si request() ne répond jamais', async () => {
    const stockage = new FakePersistentStorage('not-persisted', { requestBloquee: true })
    renderWithServices(<App />, { services: avecStockage(stockage) })

    expect(await screen.findByRole('navigation')).toBeInTheDocument()
    await vider()
    expect(stockage.requestCalls).toBe(1)
  })

  it('n’affiche rien de plus au démarrage : pas de ligne d’état hors des Réglages', async () => {
    renderWithServices(<App />, {
      services: avecStockage(new FakePersistentStorage('not-persisted')),
    })
    await screen.findByRole('navigation')
    await vider()

    expect(screen.queryByRole('status', { name: 'Protection des données' })).toBeNull()
  })
})

describe('Stockage persistant — Réglages, groupe Sauvegarde', () => {
  const ouvrir = (stockage: FakePersistentStorage) =>
    renderWithServices(<ReglagesEcran />, { services: avecStockage(stockage) })

  const demander = 'Demander la protection'
  const rappel = 'Tout vit sur ce téléphone : exportez pour garder une copie.'

  it('protégé : la phrase de la planche, le rappel d’exporter, sans lien', async () => {
    ouvrir(new FakePersistentStorage('persisted'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent(
      `${rappel} Le navigateur s’est engagé à ne pas effacer les données de lui-même.`,
    )
    expect(screen.queryByRole('button', { name: demander })).toBeNull()
  })

  it('non protégé : le rappel, le risque, et « Demander la protection » hors de la région live', async () => {
    ouvrir(new FakePersistentStorage('not-persisted'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent(rappel)
    expect(etat).toHaveTextContent('Le navigateur peut effacer les données si l’espace manque.')
    const bouton = screen.getByRole('button', { name: demander })
    expect(etat).not.toContainElement(bouton)
    expect(within(etat).queryByRole('button')).toBeNull()
  })

  it('indisponible : le rappel, sans lien', async () => {
    ouvrir(new FakePersistentStorage('unavailable'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent(rappel)
    expect(etat).toHaveTextContent('Ce navigateur ne sait pas protéger les données.')
    expect(screen.queryByRole('button', { name: demander })).toBeNull()
  })

  it.each(['persisted', 'not-persisted', 'unavailable'] as const)(
    '%s : le rappel d’exporter est toujours là',
    async (etat) => {
      ouvrir(new FakePersistentStorage(etat))
      expect(
        await screen.findByRole('status', { name: 'Protection des données' }),
      ).toHaveTextContent(rappel)
    },
  )

  it('« Demander la protection » rappelle la demande et met l’état à jour sans recharger', async () => {
    const stockage = new FakePersistentStorage('not-persisted', { accorde: true })
    ouvrir(stockage)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: demander }))

    expect(stockage.requestCalls).toBe(1)
    expect(await screen.findByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'Le navigateur s’est engagé',
    )
    expect(screen.queryByRole('button', { name: demander })).toBeNull()
  })

  it('un refus laisse l’état « non protégé » et le lien', async () => {
    const stockage = new FakePersistentStorage('not-persisted', { accorde: false })
    ouvrir(stockage)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: demander }))

    expect(stockage.requestCalls).toBe(1)
    expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'peut effacer',
    )
    expect(screen.getByRole('button', { name: demander })).toBeInTheDocument()
  })

  describe('retour d’une demande refusée', () => {
    const refus = 'Le navigateur a refusé.'

    it('n’affiche aucun refus avant tout clic, même si le démarrage a été refusé', async () => {
      const stockage = new FakePersistentStorage('not-persisted', { accorde: false })
      renderWithServices(<App />, { services: avecStockage(stockage) })
      await screen.findByRole('navigation')
      await vider()
      expect(stockage.requestCalls).toBe(1)

      renderWithServices(<ReglagesEcran />, { services: avecStockage(stockage) })
      const etat = await screen.findByRole('status', { name: 'Protection des données' })
      expect(etat).not.toHaveTextContent(refus)
    })

    it('oriente vers le voyant Application, et reste au second refus', async () => {
      ouvrir(new FakePersistentStorage('not-persisted', { accorde: false }))
      const utilisateur = userEvent.setup()

      await utilisateur.click(await screen.findByRole('button', { name: demander }))
      const etat = screen.getByRole('status', { name: 'Protection des données' })
      expect(etat).toHaveTextContent(
        'Le navigateur a refusé. Il accepte en général une fois Dartpéro installé (voir Application, en haut).',
      )
      expect(etat).toHaveTextContent(rappel)

      await utilisateur.click(screen.getByRole('button', { name: demander }))
      expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
        refus,
      )
      expect(screen.getByRole('button', { name: demander })).toBeInTheDocument()
    })

    it('Dartpéro déjà installé : le refus seul, sans renvoi vers l’installation', async () => {
      const base = fakeServices().dependencies
      const services = fakeServices({
        devices: {
          ...base.devices,
          persistentStorage: new FakePersistentStorage('not-persisted', { accorde: false }),
          appInstallation: new FakeAppInstallation('installed'),
        },
      }).services
      renderWithServices(<ReglagesEcran />, { services })
      const utilisateur = userEvent.setup()

      await utilisateur.click(await screen.findByRole('button', { name: demander }))

      const etat = screen.getByRole('status', { name: 'Protection des données' })
      expect(etat).toHaveTextContent(refus)
      expect(etat).not.toHaveTextContent('voir Application')
    })

    it('n’apparaît pas quand la demande est accordée, et disparaît après un refus puis un accord', async () => {
      const stockage = new FakePersistentStorage('not-persisted', { accorde: false })
      ouvrir(stockage)
      const utilisateur = userEvent.setup()

      await utilisateur.click(await screen.findByRole('button', { name: demander }))
      expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
        refus,
      )

      stockage.request = async () => {
        stockage.etat = 'persisted'
        return 'persisted'
      }
      await utilisateur.click(screen.getByRole('button', { name: demander }))
      const etat = await screen.findByRole('status', { name: 'Protection des données' })
      expect(etat).toHaveTextContent('Le navigateur s’est engagé')
      expect(etat).not.toHaveTextContent(refus)
    })
  })

  it('ne rend rien à la place de la phrase tant que status() n’a pas répondu', async () => {
    const stockage = new FakePersistentStorage('not-persisted')
    let liberer: () => void = () => {}
    stockage.status = () =>
      new Promise((resoudre) => {
        liberer = () => resoudre('not-persisted')
      })
    ouvrir(stockage)

    await screen.findByRole('heading', { name: 'Réglages' })
    expect(screen.queryByRole('status', { name: 'Protection des données' })).toBeNull()
    expect(screen.queryByRole('button', { name: demander })).toBeNull()

    await act(async () => liberer())
    expect(
      await screen.findByRole('status', { name: 'Protection des données' }),
    ).toBeInTheDocument()
  })
})
