import type { ReactNode } from 'react'

type Props = {
  readonly titre: string
  readonly sousTitre?: string
  readonly action?: ReactNode
}

/** L'en-tête commun des écrans de navigation : où je suis, et ce que j'y fais.
 *  Oswald pour la tâche — Alfa Slab reste réservée à l'enseigne. */
export const EnTeteEcran = ({ titre, sousTitre, action }: Props) => (
  <header className="flex items-end justify-between gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
    <div className="min-w-0">
      <h1 className="font-score text-3xl font-bold uppercase tracking-wide text-craie-vive">
        {titre}
      </h1>
      {sousTitre && (
        <p className="mt-0.5 font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie/60">
          {sousTitre}
        </p>
      )}
    </div>
    {action}
  </header>
)
