import { Crown, Flag } from 'lucide-react'
import type { Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { couleurJoueur } from '@/ui/couleurs'

/** « BULL » est le nom de la cible dans le domaine ; à l'écran on dit « bulle ». */
export const libelleCible = (cible: Segment | null): string => {
  if (cible === null) return '—'
  if (cible === 'BULL') return 'Bulle'
  if (cible === 'MISS') return '0'
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
        'cadre-bois relative flex items-center gap-3 overflow-hidden rounded-2xl pl-4 pr-3',
        compact ? 'py-2' : 'py-3',
        'transition-opacity duration-300',
        actif ? 'animate-halo' : 'opacity-75',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: teinte.fond }}
        className="absolute inset-y-0 left-0 w-1.5"
      />

      {/* La cible du moment, à la place du score géant. */}
      <div className={`flex shrink-0 flex-col items-center ${compact ? 'w-20' : 'w-24'}`}>
        <output
          aria-label={`Cible de ${nom}`}
          className={[
            'chiffres trace-craie block font-bold leading-none',
            boucle ? 'text-vert-cible' : 'text-craie-vive',
            compact ? 'text-4xl' : 'text-5xl',
          ].join(' ')}
        >
          {boucle ? <Flag aria-hidden="true" className="mx-auto size-9" /> : libelleCible(cible)}
        </output>

        <p className="mt-1 flex min-w-0 max-w-full items-center gap-1.5">
          <Avatar nom={nom} couleur={couleur} taille="xs" />
          <span
            className={`truncate font-score text-xs font-bold uppercase tracking-wider ${
              actif ? 'text-laiton' : 'text-craie/70'
            }`}
          >
            {nom}
          </span>
          {vainqueur && <Crown aria-hidden="true" className="size-3.5 shrink-0 text-laiton" />}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-score text-[0.6rem] uppercase tracking-[0.2em] text-craie/60">
            Parcours
          </span>
          <span className="chiffres text-sm font-bold text-craie">
            {validees}
            <span className="font-normal text-craie/50">/{total}</span>
          </span>
        </div>

        {/* La barre de laiton : on voit qui mène sans lire un chiffre. */}
        <div className="h-2 overflow-hidden rounded-full border border-chene/50 bg-feutre/70">
          <div
            aria-hidden="true"
            style={{ width: `${pourcentage}%` }}
            className={`h-full rounded-full transition-[width] duration-300 ${
              boucle ? 'bg-vert-cible' : 'laiton-poli'
            }`}
          />
        </div>

        <span className="font-score text-[0.65rem] uppercase tracking-wider text-craie/60">
          {flechettes} fléchette{flechettes > 1 ? 's' : ''}
        </span>
      </div>
    </article>
  )
}
