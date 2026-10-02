import { useCallback, useSyncExternalStore } from 'react'
import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import { useServices } from '../providers/ServicesProvider'

/**
 * « Plus tard » sur l'Accueil : un booléen, `false` par défaut. Préférence
 * d'appareil, hors sauvegarde JSON. ⚠️ La clé ne se renomme jamais (précédent
 * `partie:legs`) : renommée, l'invitation reviendrait chez tous ceux qui
 * l'avaient écartée.
 */
export const CLE_INSTALLATION_ECARTEE = 'installation:ecartee'

/** Un état où l'app peut proposer quelque chose : un bouton, ou un guide. */
export const installationPossible = (etat: InstallState): boolean =>
  etat === 'installable' || etat === 'ios-manual' || etat === 'ios-other-browser'

/**
 * L'état d'installation, suivi en direct : l'invite peut arriver après le
 * montage, l'installation aboutir pendant que la page est ouverte.
 *
 * `useSyncExternalStore` plutôt que `useState` + `useEffect` : c'est le contrat
 * de React pour une source externe, sans rater un changement survenu entre le
 * rendu et l'abonnement. Ni TanStack Query : c'est une capacité d'appareil.
 *
 * `installer` ouvre l'invite native — à appeler directement depuis le
 * gestionnaire de clic, sans attente préalable.
 */
export const useInstallation = (): {
  readonly etat: InstallState
  readonly installer: () => void
} => {
  const installation = useServices().devices.appInstallation

  const abonner = useCallback(
    (onChange: () => void) => installation.subscribe(onChange),
    [installation],
  )
  const lire = useCallback(() => installation.state(), [installation])
  const etat = useSyncExternalStore(abonner, lire)

  const installer = useCallback(() => {
    void installation.prompt()
  }, [installation])

  return { etat, installer }
}
