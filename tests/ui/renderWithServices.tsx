import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import type { Services } from '@/composition/container'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'
import { SondeHistorique } from './gestes'

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
    readonly historique?: readonly (
      | string
      | { readonly pathname: string; readonly state: unknown }
    )[]
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
