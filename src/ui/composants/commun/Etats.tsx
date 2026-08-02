import type { ReactNode } from 'react'

export const Spinner = ({ label = 'Chargement…' }: { readonly label?: string }) => (
  <output className="flex items-center justify-center gap-3 py-10 text-craie/70">
    <span className="size-6 animate-spin rounded-full border-2 border-laiton border-t-transparent" />
    <span className="font-score text-sm uppercase tracking-widest">{label}</span>
  </output>
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
  <div className="ardoise-craie flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center">
    <p className="font-display text-xl text-laiton">{titre}</p>
    <p className="max-w-xs text-sm text-craie/70">{description}</p>
    {action}
  </div>
)

export const MessageErreur = ({ children }: { readonly children: ReactNode }) => (
  <p
    role="alert"
    className="rounded-xl border-2 border-rouge-cible/70 bg-rouge-cible/15 px-4 py-3 text-sm text-craie"
  >
    {children}
  </p>
)
