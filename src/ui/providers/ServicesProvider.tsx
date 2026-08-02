import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { createBrowserServices, type Services } from '@/composition/container'

const ServicesContext = createContext<Services | null>(null)

type Props = {
  readonly children: ReactNode
  /** Injecté par les tests. En production, le composition root fait foi. */
  readonly services?: Services
}

export const ServicesProvider = ({ children, services }: Props) => {
  const valeur = useMemo(() => services ?? createBrowserServices(), [services])
  return <ServicesContext.Provider value={valeur}>{children}</ServicesContext.Provider>
}

/**
 * Le seul accès de l'UI au métier. Un composant n'appelle jamais Dexie ni le
 * domaine directement — il passe par un use case exposé ici.
 */
export const useServices = (): Services => {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices doit être appelé dans un <ServicesProvider>')
  return services
}
