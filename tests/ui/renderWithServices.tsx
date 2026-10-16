import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import type { Services } from '@/composition/container'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import { SondeHistorique } from './gestes'

/**
 * Rend un écran avec des services injectés (adapters en mémoire).
 * `ServicesProvider` reçoit toujours ses services de l'extérieur : aucun test
 * d'UI ne touche IndexedDB.
 */
export const renderWithServices = (
  ui: ReactNode,
  {
    services,
    route = '/',
    historique,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  }: {
    readonly services: Services
    readonly route?: string
    /**
     * Plusieurs entrées d'historique, la dernière ouverte : pour prouver qu'un
     * retour ramène à l'entrée d'avant, ou qu'il ne quitte pas l'écran.
     * Remplace `route`. Une entrée peut porter un état d'historique (une
     * modale ouverte au rechargement).
     */
    readonly historique?: readonly (
      | string
      | { readonly pathname: string; readonly state: unknown }
    )[]
    /** Un client partagé (et gardé par le test) : pour prouver une invalidation de cache. */
    readonly queryClient?: QueryClient
  },
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <MemoryRouter initialEntries={historique ? [...historique] : [route]}>
          {ui}
          <SondeHistorique />
        </MemoryRouter>
      </ServicesProvider>
    </QueryClientProvider>,
  )
}
