import type { ReactNode } from 'react'

type Props = {
  readonly titre: string
  readonly sousTitre?: string
  readonly action?: ReactNode
}

/** L'en-tête commun des écrans de navigation : où je suis, et ce que j'y fais. */
export const EnTeteEcran = ({ titre, sousTitre, action }: Props) => (
  <header className="flex items-end justify-between gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
    <div className="min-w-0">
      <h1 className="font-display text-3xl text-laiton drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]">
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
