import { createContext, type ReactNode, useContext } from 'react'
import type { Services } from '@/composition/container'

const ServicesContext = createContext<Services | null>(null)

type Props = {
  readonly children: ReactNode
  /**
   * Toujours injecté : par `src/main.tsx` en production (créés une seule fois,
   * avant le premier rendu), par `renderWithServices` dans les tests. Le
   * provider ne crée plus rien — sous `StrictMode`, un `useMemo` rejoué aurait
   * créé deux jeux d'adapters, dont un fantôme qui garderait l'invite
   * d'installation.
   */
  readonly services: Services
}

export const ServicesProvider = ({ children, services }: Props) => (
  <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
)

/**
 * Le seul accès de l'UI au métier. Un composant n'appelle jamais Dexie ni le
 * domaine directement — il passe par un use case exposé ici.
 */
export const useServices = (): Services => {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices doit être appelé dans un <ServicesProvider>')
  return services
}
