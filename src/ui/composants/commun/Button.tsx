import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primaire' | 'secondaire' | 'discret'

/**
 * Cibles ≥ 48 px : on tape debout, une fléchette dans l'autre main.
 * `min-h-12` = 48 px, jamais descendre en dessous.
 */
const VARIANTES: Record<Variante, string> = {
  primaire: 'laiton-poli shadow-[0_2px_0_rgba(0,0,0,0.45)] active:translate-y-px',
  secondaire: 'border-2 border-chene bg-ardoise text-craie active:bg-chene/30',
  discret: 'text-craie/70 active:text-craie',
}

export const classesBouton = (variante: Variante = 'primaire'): string =>
  [
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5',
    'font-score text-base font-bold uppercase tracking-widest',
    'transition-colors disabled:opacity-40',
    VARIANTES[variante],
  ].join(' ')

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variante?: Variante
  readonly children: ReactNode
}

export const Button = ({ variante = 'primaire', className = '', children, ...reste }: Props) => (
  <button type="button" className={`${classesBouton(variante)} ${className}`} {...reste}>
    {children}
  </button>
)
