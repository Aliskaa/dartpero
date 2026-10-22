import { useCallback, useSyncExternalStore } from 'react'
import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import { useServices } from '../providers/ServicesProvider'

/** « Plus tard » sur l'Accueil, hors sauvegarde. ⚠️ La clé ne se renomme jamais : l'invitation reviendrait. */
export const CLE_INSTALLATION_ECARTEE = 'installation:ecartee'

/** Un état où l'Accueil propose sa ligne. ⚠️ Pas le critère des Réglages (`guideInstallationVisible`). */
export const installationPossible = (etat: InstallState): boolean =>
  etat === 'installable' || etat === 'ios-manual' || etat === 'ios-other-browser'

/** L'état d'installation en direct (`useSyncExternalStore`) ; `installer` s'appelle directement depuis un clic. */
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
