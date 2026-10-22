import { createContext, type ReactNode, useContext } from 'react'
import type { Services } from '@/composition/container'

const ServicesContext = createContext<Services | null>(null)

type Props = {
  readonly children: ReactNode
  /** ⚠️ Toujours injecté (`main.tsx`, `renderWithServices`) : le provider ne crée rien, `StrictMode` doublerait les adapters. */
  readonly services: Services
}

export const ServicesProvider = ({ children, services }: Props) => (
  <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
)

/** Le seul accès de l'UI au métier : jamais Dexie ni le domaine directement, un use case exposé ici. */
export const useServices = (): Services => {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices doit être appelé dans un <ServicesProvider>')
  return services
}
