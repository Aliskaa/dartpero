import type { CSSProperties, ReactNode } from 'react'
import { LIBELLE_TABLEAU_SCORES } from '@/ui/labels'

type Props = {
  /** Une variable de grille partagée par l'en-tête et les lignes (`--nb-cibles`). */
  readonly style?: CSSProperties
  /** Colonnes en littéral complet (`grid-cols-[…] paysage:grid-cols-[…]`) : Tailwind ne scanne que le texte écrit. */
  readonly grille: string
  /** Les en-têtes de colonnes, dans la bande inversée (`aria-hidden`). */
  readonly entetes: ReactNode
  readonly nbLignes: number
  /** La ligne du joueur qui lance ; `null` : pas de repère (partie finie). */
  readonly indexActif: number | null
  /** Sous les lignes, hors de leur grille : le ruban de sortie, la ligne de volée. */
  readonly pied?: ReactNode
  /** Les lignes, de hauteur strictement égale (`<article aria-current>`). */
  readonly children: ReactNode
}

/** Feuille de match commune : cadre, en-têtes, un filet par ligne et UN repère qui glisse. ⚠️ Lignes de hauteur strictement égale (`translateY(index * 100%)`). */
export const FeuilleMatch = ({
  style,
  grille,
  entetes,
  nbLignes,
  indexActif,
  pied,
  children,
}: Props) => (
  <section aria-label={LIBELLE_TABLEAU_SCORES} style={style} className="feuille flex flex-col">
    <div className={`bandeau-feuille items-center ${grille} py-1`} aria-hidden="true">
      {entetes}
    </div>

    <div className="relative grid" style={{ gridTemplateRows: `repeat(${nbLignes}, 1fr)` }}>
      {indexActif !== null && (
        <span
          aria-hidden="true"
          style={{
            height: `${100 / nbLignes}%`,
            transform: `translateY(${indexActif * 100}%)`,
          }}
          className="repere-lancer pointer-events-none absolute inset-x-0 top-0"
        />
      )}

      {children}
    </div>

    {pied}
  </section>
)
