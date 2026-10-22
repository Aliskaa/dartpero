import { Flag } from 'lucide-react'
import type { Dart, Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { CasesVolee } from '@/ui/composants/commun/CasesVolee'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import {
  LIBELLE_BULLE,
  LIBELLE_HORS,
  libelleFlechetteTourDuMonde,
  motFlechettes,
} from '@/ui/labels'

/** « BULL » est le nom de la cible dans le domaine ; à l'écran on dit « bulle ». */
export const libelleCible = (cible: Segment | null): string => {
  if (cible === null) return '—'
  if (cible === 'BULL') return LIBELLE_BULLE
  if (cible === 'MISS') return LIBELLE_HORS
  return String(cible)
}

/** Colonnes JOUEUR, PARCOURS, CIBLE (le chiffre géant). ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit. */
export const GRILLE_TOUR_DU_MONDE =
  'grid grid-cols-[minmax(0,1fr)_6.5rem_7rem] paysage:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem]'

/** Hauteur minimale de CHAQUE ligne, la même pour toutes (le repère glisse par `translateY(index * 100%)`). */
const HAUTEUR = [
  'min-h-26 paysage:min-h-15.5',
  'min-h-26 paysage:min-h-15.5',
  'min-h-22 paysage:min-h-15.5',
  'min-h-20 paysage:min-h-15.5',
] as const

/** Taille de la cible par palier ; les `text-score-*` existent déjà, aucune taille en dur. */
const TAILLE_CIBLE = [
  'text-score-xl-portrait paysage:text-score-l leading-[0.86]',
  'text-score-xl-portrait paysage:text-score-l leading-[0.86]',
  'text-score-l-portrait paysage:text-score-l leading-[0.88]',
  'text-score-l-portrait paysage:text-score-l leading-[0.88]',
] as const

/** La bulle comme cible : glyphe SVG local, `aria-hidden`, « BULLE » dessous. */
const GlypheBulle = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.6}
    className="mx-auto block size-[0.66em]"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
  </svg>
)

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly cible: Segment | null
  readonly validees: number
  readonly total: number
  readonly flechettes: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly nbJoueurs: number
  /** La volée en cours (joueur actif) ou sa dernière volée ; vide : trois « — ». */
  readonly volee: readonly Dart[]
  readonly etiquetteVolee: string
}

/** Zone lecture du Tour du monde : une ligne par joueur, la cible à viser prend la place du chiffre géant. */
export const LigneCible = ({
  nom,
  couleur,
  cible,
  validees,
  total,
  flechettes,
  actif,
  vainqueur,
  nbJoueurs,
  volee,
  etiquetteVolee,
}: Props) => {
  const boucle = cible === null
  const pourcentage = total === 0 ? 0 : Math.round((validees / total) * 100)
  const echelle = Math.min(Math.max(nbJoueurs, 1), HAUTEUR.length) - 1

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={['ligne-tableau relative', GRILLE_TOUR_DU_MONDE, HAUTEUR[echelle]].join(' ')}
    >
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3 py-2 paysage:gap-1.5 paysage:py-1">
        <NomJoueurFeuille
          nom={nom}
          couleur={couleur}
          actif={actif}
          vainqueur={vainqueur}
          serre={nbJoueurs > 2}
        />
        <div className="pl-[1.125rem]">
          <CasesVolee
            aria-label={etiquetteVolee}
            darts={volee}
            libelle={libelleFlechetteTourDuMonde}
          />
        </div>
      </div>

      <div className="filet-colonne flex min-w-0 flex-col justify-center gap-1.5 px-2.5">
        <span className="chiffres text-sm text-craie-3">
          <span className="text-xl font-bold text-craie">{validees}</span>/{total}
        </span>

        <div className="h-2 border border-craie/30 bg-feutre/70">
          <div
            aria-hidden="true"
            style={{ width: `${pourcentage}%` }}
            className={`h-full transition-[width] duration-300 ${
              boucle ? 'bg-vert-cible' : 'bg-laiton'
            }`}
          />
        </div>

        <span className="whitespace-nowrap font-score text-etiquette tracking-[0.02em] text-craie-3">
          <span className="chiffres font-semibold text-craie-2">{flechettes}</span>{' '}
          {motFlechettes(flechettes)}
        </span>
      </div>

      <div className="filet-colonne flex min-w-0 items-center justify-center">
        <output
          aria-label={`Cible de ${nom}`}
          className={[
            'chiffres block text-center font-bold',
            boucle ? 'text-vert-cible' : actif ? 'trace-craie text-craie-vive' : 'text-craie',
            TAILLE_CIBLE[echelle],
          ].join(' ')}
        >
          <span key={String(cible)} className="inline-block animate-pop-score">
            {boucle ? (
              <Flag aria-hidden="true" className="mx-auto size-10" />
            ) : cible === 'BULL' ? (
              <>
                <GlypheBulle />
                <span className="mt-1 block font-score text-etiquette font-semibold uppercase leading-4 tracking-[0.18em] text-craie-2 [text-shadow:none]">
                  {LIBELLE_BULLE}
                </span>
              </>
            ) : (
              libelleCible(cible)
            )}
          </span>
        </output>
      </div>
    </article>
  )
}
