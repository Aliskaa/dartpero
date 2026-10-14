import type { CSSProperties, ReactNode } from 'react'
import { LIBELLE_TABLEAU_SCORES } from '@/ui/labels'

type Props = {
  /** Une variable de grille partagée par l'en-tête et les lignes (`--nb-cibles`). */
  readonly style?: CSSProperties
  /**
   * Les colonnes, en LITTÉRAL COMPLET (`grid grid-cols-[…] paysage:grid-cols-[…]`) :
   * Tailwind ne scanne que le texte écrit. Les lignes reprennent la même grille.
   */
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

/**
 * LA FEUILLE de match, commune aux trois jeux : cadre de craie, en-têtes de
 * colonnes en inversion, un filet par ligne, et UN repère qui glisse.
 *
 * Les lignes ont une hauteur STRICTEMENT égale (`1fr`, donc celle de la plus
 * haute) : c'est ce qui permet au repère de se placer par un simple
 * `translateY(index * 100%)`, sans rien mesurer. Une ligne plus haute que les
 * autres casserait le glissement : chaque jeu fixe donc sa hauteur minimale
 * pour **toutes** ses lignes.
 *
 * Le repère est le premier enfant, donc sous les lignes (positionnées, peintes
 * après lui). `aria-current` sur la ligne reste l'état accessible ; le repère
 * est décoratif.
 *
 * Le moment célébré n'est PAS rendu ici : l'écran le superpose au bas de la
 * feuille, hors du flux (`MomentCelebratif`).
 */
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
