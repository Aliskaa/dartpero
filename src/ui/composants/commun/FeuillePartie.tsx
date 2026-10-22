import type { ReactNode } from 'react'

/** Feuille de parties : filet en tête, lignes (`CartePartie`) sur l'ardoise, filet fin entre elles. */
export const FeuillePartie = ({ children }: { readonly children: ReactNode }) => (
  <ul className="border-t-[3px] border-craie bg-ardoise">{children}</ul>
)
