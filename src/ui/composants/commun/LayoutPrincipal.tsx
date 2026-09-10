import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { SpinnerLigne } from './Etats'
import { NavigationBasse } from './NavigationBasse'

/**
 * Les écrans « hors partie » partagent le même cadre : le tapis de feutre, et
 * la barre de navigation collée en bas.
 *
 * `min-h-dvh` sur le conteneur plutôt que sur chaque écran, sinon la barre se
 * retrouve poussée sous la ligne de flottaison quand le contenu est court.
 *
 * `SpinnerLigne` en secours plutôt que `Spinner` : son `min-h-dvh` pousserait
 * `NavigationBasse` hors champ puis la ferait remonter d'un coup.
 */
export const LayoutPrincipal = () => (
  <div className="feutre-tapis flex min-h-dvh flex-col">
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<SpinnerLigne />}>
        <Outlet />
      </Suspense>
    </div>
    <NavigationBasse />
  </div>
)
