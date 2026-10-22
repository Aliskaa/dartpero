import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { SpinnerLigne } from './Etats'
import { NavigationBasse } from './NavigationBasse'

/** Cadre des écrans hors partie : tapis de feutre et `NavigationBasse`. ⚠️ `SpinnerLigne` en secours : `Spinner` (`min-h-dvh`) pousserait la barre hors champ. */
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
