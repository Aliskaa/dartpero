import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import type { Services } from '@/composition/container'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'

/**
 * Rend un écran avec des services injectés (adapters en mémoire).
 * `ServicesProvider` accepte une injection précisément pour ça : aucun test
 * d'UI ne touche IndexedDB.
 */
export const renderWithServices = (
  ui: ReactNode,
  { services, route = '/' }: { readonly services: Services; readonly route?: string },
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ServicesProvider>
    </QueryClientProvider>,
  )
}
