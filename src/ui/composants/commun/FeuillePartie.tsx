import type { ReactNode } from 'react'

/**
 * Une feuille de parties : un filet de 3 px en tête, les lignes (`CartePartie`)
 * posées sur l'ardoise, un filet fin entre elles et aucun sous la dernière.
 * Les lignes d'une même période n'en forment qu'une seule.
 */
export const FeuillePartie = ({ children }: { readonly children: ReactNode }) => (
  <ul className="border-t-[3px] border-craie bg-ardoise">{children}</ul>
)
