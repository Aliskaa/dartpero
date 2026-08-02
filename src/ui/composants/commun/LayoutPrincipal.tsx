import { Outlet } from 'react-router'
import { NavigationBasse } from './NavigationBasse'

/**
 * Les écrans « hors partie » partagent le même cadre : le tapis de feutre, et
 * la barre de navigation collée en bas.
 *
 * `min-h-dvh` sur le conteneur plutôt que sur chaque écran, sinon la barre se
 * retrouve poussée sous la ligne de flottaison quand le contenu est court.
 */
export const LayoutPrincipal = () => (
  <div className="feutre-tapis flex min-h-dvh flex-col">
    <div className="flex flex-1 flex-col">
      <Outlet />
    </div>
    <NavigationBasse />
  </div>
)
