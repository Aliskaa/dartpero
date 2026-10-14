import { Flag } from 'lucide-react'
import type { Dart, Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { CasesVolee } from '@/ui/composants/commun/CasesVolee'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import { LIBELLE_BULLE, motFlechettes } from '@/ui/labels'

/** « BULL » est le nom de la cible dans le domaine ; à l'écran on dit « bulle ». */
export const libelleCible = (cible: Segment | null): string => {
  if (cible === null) return '—'
  if (cible === 'BULL') return LIBELLE_BULLE
  if (cible === 'MISS') return 'Hors'
  return String(cible)
}

/**
 * Les colonnes : JOUEUR (le nom et la volée), PARCOURS (6,5 rem) et CIBLE
 * (7 rem), le chiffre géant à droite — à la place du RESTE du X01. En paysage la
 * cible est plus petite, le parcours un peu plus large (planche).
 * ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit.
 */
export const GRILLE_TOUR_DU_MONDE =
  'grid grid-cols-[minmax(0,1fr)_6.5rem_7rem] paysage:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem]'

/**
 * Hauteur minimale de CHAQUE ligne, la même pour toutes (le repère glisse par
 * `translateY(index * 100%)`) — planche : 104 px à 1-2 joueurs, 88 à 3, 80 à 4,
 * 62 en paysage.
 */
const HAUTEUR = [
  'min-h-26 paysage:min-h-15.5',
  'min-h-26 paysage:min-h-15.5',
  'min-h-22 paysage:min-h-15.5',
  'min-h-20 paysage:min-h-15.5',
] as const

/**
 * La cible : 4,5 rem jusqu'à 2 joueurs, 4,05 rem à 3 et 4, 3,25 rem en paysage.
 * Les paliers `text-score-*` existent déjà : aucune taille en dur.
 */
const TAILLE_CIBLE = [
  'text-score-xl-portrait paysage:text-score-l leading-[0.86]',
  'text-score-xl-portrait paysage:text-score-l leading-[0.86]',
  'text-score-l-portrait paysage:text-score-l leading-[0.88]',
  'text-score-l-portrait paysage:text-score-l leading-[0.88]',
] as const

/**
 * La bulle, comme cible : un glyphe plein (anneau et cœur), sous lequel s'écrit
 * « BULLE ». Un pictogramme de plus dans la liste des douze n'est pas justifié
 * pour un seul emploi : il vit ici, en SVG local, `aria-hidden`.
 */
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

/**
 * ZONE LECTURE du Tour du monde — une ligne de la feuille commune par joueur.
 *
 * Ce qui se lit à 3 mètres ici, ce n'est pas un score mais **la cible à
 * viser** : c'est elle qui prend la place du chiffre géant (colonne CIBLE, à
 * droite, comme le RESTE au X01). La progression (compte, barre, fléchettes
 * lancées) dit le reste du chemin ; la volée s'écrit sous le nom.
 */
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
      {/* COLONNE 1 — qui joue, et ce qu'il vient d'écrire. Les cases sont
          décalées du carré (12 px) et de son espace (6 px) : elles s'alignent
          sur le nom. */}
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3 py-2 paysage:gap-1.5 paysage:py-1">
        <NomJoueurFeuille
          nom={nom}
          couleur={couleur}
          actif={actif}
          vainqueur={vainqueur}
          serre={nbJoueurs > 2}
        />
        <div className="pl-[1.125rem]">
          <CasesVolee aria-label={etiquetteVolee} darts={volee} />
        </div>
      </div>

      {/* COLONNE 2 — le parcours : le compte, la barre, les fléchettes lancées. */}
      <div className="filet-colonne flex min-w-0 flex-col justify-center gap-1.5 px-2.5">
        <span className="chiffres text-sm text-craie-3">
          <span className="text-xl font-bold text-craie">{validees}</span>/{total}
        </span>

        {/* La barre : on voit qui mène sans lire un chiffre. Accent du mode, puis
            vert une fois le parcours bouclé. */}
        <div className="h-2 border border-craie/30 bg-feutre/70">
          <div
            aria-hidden="true"
            style={{ width: `${pourcentage}%` }}
            className={`h-full transition-[width] duration-300 ${
              boucle ? 'bg-vert-cible' : 'bg-accent-mode'
            }`}
          />
        </div>

        <span className="whitespace-nowrap font-score text-etiquette tracking-[0.02em] text-craie-3">
          <span className="chiffres font-semibold text-craie-2">{flechettes}</span>{' '}
          {motFlechettes(flechettes)}
        </span>
      </div>

      {/* COLONNE 3 — la cible du moment, à la place du score géant. */}
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
