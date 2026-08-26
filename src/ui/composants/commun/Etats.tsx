import type { ReactNode } from 'react'
import { Cible } from './Cible'

/** Chargement : une cible qui tourne, plutôt qu'un anneau générique. */
export const Spinner = ({ label = 'Chargement…' }: { readonly label?: string }) => (
  <output className="feutre-tapis flex min-h-dvh flex-col items-center justify-center gap-5">
    <Cible className="size-20 animate-spin [animation-duration:2.4s]" />
    <span className="font-score text-sm uppercase tracking-[0.3em] text-craie/70">{label}</span>
  </output>
)

/** Chargement en ligne, quand l'écran est déjà là et qu'un bloc manque. */
export const SpinnerLigne = ({ label = 'Chargement…' }: { readonly label?: string }) => (
  <output className="flex items-center justify-center gap-3 py-8 text-craie/70">
    <Cible className="size-6 animate-spin [animation-duration:2.4s]" />
    <span className="font-score text-sm uppercase tracking-widest">{label}</span>
  </output>
)

/** Ardoise vierge, en attendant que la requête réponde. */
export const Skeleton = ({ className = '' }: { readonly className?: string }) => (
  <div aria-hidden="true" className={`chargement-balai bg-ardoise/80 ${className}`} />
)

export const EmptyState = ({
  titre,
  description,
  action,
}: {
  readonly titre: string
  readonly description: string
  readonly action?: ReactNode
}) => (
  <div className="flex animate-monter flex-col items-center gap-3 border border-chene/40 bg-ardoise px-6 py-10 text-center">
    <Cible className="size-14 opacity-60" />
    <p className="font-score text-lg font-bold uppercase tracking-wide text-laiton">{titre}</p>
    <p className="max-w-xs text-sm text-craie/70">{description}</p>
    {action}
  </div>
)

export const MessageErreur = ({ children }: { readonly children: ReactNode }) => (
  <p
    role="alert"
    className={[
      'animate-monter border-2 border-rouge-cible/70 bg-rouge-cible/15 px-4 py-3',
      'text-sm text-craie shadow-[0_0_20px_-8px_var(--color-rouge-cible)]',
    ].join(' ')}
  >
    {children}
  </p>
)

/** L'écran « cette partie est introuvable » — mêmes murs que le reste de l'app. */
export const EcranErreur = ({
  message,
  action,
}: {
  readonly message: string
  readonly action: ReactNode
}) => (
  <main className="feutre-tapis flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
    <Cible className="size-20 opacity-40" />
    <MessageErreur>{message}</MessageErreur>
    {action}
  </main>
)
