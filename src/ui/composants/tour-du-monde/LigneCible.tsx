import { Flag } from 'lucide-react'
import type { Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { couleurJoueur } from '@/ui/couleurs'
import { LIBELLE_VAINQUEUR } from '@/ui/labels'

/** « BULL » est le nom de la cible dans le domaine ; à l'écran on dit « bulle ». */
export const libelleCible = (cible: Segment | null): string => {
  if (cible === null) return '—'
  if (cible === 'BULL') return 'Bulle'
  if (cible === 'MISS') return 'Hors'
  return String(cible)
}

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly cible: Segment | null
  readonly validees: number
  readonly total: number
  readonly flechettes: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly compact: boolean
}

/**
 * ZONE LECTURE du Tour du monde — une ligne par joueur, comme au X01.
 *
 * Ce qui se lit à 3 mètres ici, ce n'est pas un score mais **la cible à
 * viser** : c'est elle qui prend la place du chiffre géant. La progression
 * (barre + compte) dit le reste du chemin.
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
  compact,
}: Props) => {
  const teinte = couleurJoueur(couleur)
  const boucle = cible === null
  const pourcentage = total === 0 ? 0 : Math.round((validees / total) * 100)

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={[
        'ligne-tableau relative flex items-center gap-3 overflow-hidden pl-4 pr-3',
        // Paysage : la hauteur manque, et trois ou quatre joueurs ne tenaient pas
        // dans 390 px (mesuré : 485 px de page à quatre). Une ligne plus ramassée.
        compact ? 'py-2.5 paysage:py-1' : 'py-3.5 paysage:py-2',
        actif ? 'au-lancer' : '',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: teinte.fond }}
        className="absolute inset-y-0 left-0 w-1.5"
      />

      {/* La cible du moment, à la place du score géant. */}
      <div className={`flex shrink-0 flex-col items-center ${compact ? 'w-20' : 'w-28'}`}>
        <output
          aria-label={`Cible de ${nom}`}
          className={[
            'chiffres block font-bold leading-none',
            actif ? 'trace-craie' : '',
            boucle ? 'text-vert-cible' : 'text-craie-vive',
            compact ? 'text-5xl paysage:text-4xl' : 'text-6xl paysage:text-5xl',
          ].join(' ')}
        >
          <span key={String(cible)} className="inline-block animate-pop-score">
            {boucle ? <Flag aria-hidden="true" className="mx-auto size-10" /> : libelleCible(cible)}
          </span>
        </output>

        <p className="mt-1.5 flex min-w-0 max-w-full items-center gap-1.5 paysage:mt-0.5">
          <Avatar nom={nom} couleur={couleur} taille={compact ? 'xs' : 'sm'} />
          <span
            className={`truncate font-score font-bold uppercase tracking-wider ${
              compact ? 'text-xs' : 'text-sm'
            } ${actif ? 'text-accent-mode-clair' : 'text-craie-2'}`}
          >
            {nom}
          </span>
          {vainqueur && (
            <>
              <Pictogramme nom="victoire" taille={20} className="shrink-0 text-laiton-clair" />
              <span className="sr-only">, {LIBELLE_VAINQUEUR}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 paysage:gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-score text-etiquette uppercase tracking-[0.2em] text-craie-3">
            Parcours
          </span>
          <span className={`chiffres font-bold text-craie-vive ${compact ? 'text-lg' : 'text-xl'}`}>
            {validees}
            <span className="font-normal text-craie-3">/{total}</span>
          </span>
        </div>

        {/* La barre d'accent : on voit qui mène sans lire un chiffre. */}
        <div className="h-2.5 overflow-hidden border border-chene/50 bg-feutre/70">
          <div
            aria-hidden="true"
            style={{ width: `${pourcentage}%` }}
            className={`h-full transition-[width] duration-300 ${
              boucle ? 'bg-vert-cible' : 'bg-accent-mode'
            }`}
          />
        </div>

        <span className="font-score text-etiquette uppercase tracking-wider text-craie-3">
          {flechettes} fléchette{flechettes > 1 ? 's' : ''}
        </span>
      </div>
    </article>
  )
}
