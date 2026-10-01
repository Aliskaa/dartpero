import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import { FakePersistentStorage, fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const avecStockage = (stockage: FakePersistentStorage) => {
  const base = fakeServices().dependencies
  return fakeServices({ devices: { ...base.devices, persistentStorage: stockage } }).services
}

/** Laisse les promesses déjà résolues se dérouler. */
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
    // StrictMode tout en haut : posé sous les providers de `renderWithServices`,
    // il ne rejoue pas les effets (vérifié : le garde `useRef` n'était alors
    // pas exercé, le test passait même sans lui).
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

describe('Stockage persistant — Réglages', () => {
  const ouvrir = (stockage: FakePersistentStorage) =>
    renderWithServices(<ReglagesEcran />, { services: avecStockage(stockage) })

  it('affiche l’état « protégé » avec la réserve « pas une sauvegarde », sans bouton', async () => {
    ouvrir(new FakePersistentStorage('persisted'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent(
      'Données protégées : le navigateur ne les effacera pas de lui-même.',
    )
    expect(screen.queryByRole('button', { name: 'Redemander' })).toBeNull()
    expect(etat).toHaveTextContent('Ce n’est pas une sauvegarde : exportez pour garder une copie.')
  })

  it('affiche l’état « non protégé », le rappel d’exporter et le bouton Redemander', async () => {
    ouvrir(new FakePersistentStorage('not-persisted'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent('Le navigateur peut effacer les données si l’espace manque.')
    expect(etat).toHaveTextContent('Exportez régulièrement.')
    expect(screen.getByRole('button', { name: 'Redemander' })).toBeInTheDocument()
  })

  it('affiche « indisponible » avec le rappel, et sans bouton Redemander', async () => {
    ouvrir(new FakePersistentStorage('unavailable'))

    const etat = await screen.findByRole('status', { name: 'Protection des données' })
    expect(etat).toHaveTextContent('Protection non prise en charge par ce navigateur.')
    expect(etat).toHaveTextContent('Exportez')
    expect(screen.queryByRole('button', { name: 'Redemander' })).toBeNull()
  })

  it('Redemander rappelle la demande et met l’état à jour sans recharger', async () => {
    const stockage = new FakePersistentStorage('not-persisted', { accorde: true })
    ouvrir(stockage)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: 'Redemander' }))

    expect(stockage.requestCalls).toBe(1)
    expect(await screen.findByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'Données protégées',
    )
    expect(screen.queryByRole('button', { name: 'Redemander' })).toBeNull()
  })

  it('un refus à la redemande laisse l’état « non protégé » et le bouton', async () => {
    const stockage = new FakePersistentStorage('not-persisted', { accorde: false })
    ouvrir(stockage)
    const utilisateur = userEvent.setup()

    await utilisateur.click(await screen.findByRole('button', { name: 'Redemander' }))

    expect(stockage.requestCalls).toBe(1)
    expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
      'peut effacer',
    )
    expect(screen.getByRole('button', { name: 'Redemander' })).toBeInTheDocument()
  })

  describe('retour d’une redemande refusée', () => {
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

    it('apparaît dans le status après une redemande refusée, et reste au second refus', async () => {
      ouvrir(new FakePersistentStorage('not-persisted', { accorde: false }))
      const utilisateur = userEvent.setup()
      const bouton = await screen.findByRole('button', { name: 'Redemander' })

      await utilisateur.click(bouton)
      const etat = screen.getByRole('status', { name: 'Protection des données' })
      expect(etat).toHaveTextContent(
        'Le navigateur a refusé. Il accepte en général une fois Dartpéro installé sur l’écran d’accueil.',
      )
      expect(etat).toHaveTextContent('Exportez régulièrement.')

      await utilisateur.click(screen.getByRole('button', { name: 'Redemander' }))
      expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
        refus,
      )
      expect(screen.getByRole('button', { name: 'Redemander' })).toBeInTheDocument()
    })

    it('n’apparaît pas quand la redemande est accordée, et disparaît après un refus puis un accord', async () => {
      const stockage = new FakePersistentStorage('not-persisted', { accorde: false })
      ouvrir(stockage)
      const utilisateur = userEvent.setup()

      await utilisateur.click(await screen.findByRole('button', { name: 'Redemander' }))
      expect(screen.getByRole('status', { name: 'Protection des données' })).toHaveTextContent(
        refus,
      )

      // Le navigateur finit par accorder (ex. après installation sur l'écran d'accueil).
      stockage.request = async () => {
        stockage.etat = 'persisted'
        return 'persisted'
      }
      await utilisateur.click(screen.getByRole('button', { name: 'Redemander' }))
      const etat = await screen.findByRole('status', { name: 'Protection des données' })
      expect(etat).toHaveTextContent('Données protégées')
      expect(etat).not.toHaveTextContent(refus)
    })
  })

  it('ne rend rien à la place de la ligne d’état tant que status() n’a pas répondu', async () => {
    const stockage = new FakePersistentStorage('not-persisted')
    let liberer: () => void = () => {}
    stockage.status = () =>
      new Promise((resoudre) => {
        liberer = () => resoudre('not-persisted')
      })
    ouvrir(stockage)

    await screen.findByRole('heading', { name: 'Réglages' })
    expect(screen.queryByRole('status', { name: 'Protection des données' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Redemander' })).toBeNull()

    await act(async () => liberer())
    expect(
      await screen.findByRole('status', { name: 'Protection des données' }),
    ).toBeInTheDocument()
  })
})
