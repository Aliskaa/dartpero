import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primaire' | 'secondaire' | 'discret' | 'danger'
type Taille = 'xs' | 'sm' | 'md' | 'lg'

/** Cibles ≥ 48 px (`min-h-12`) : on tape debout, une fléchette dans l'autre main. */
const VARIANTES: Record<Variante, string> = {
  // Le laiton porte son relief dans `.laiton-poli` (biseau, reflet, enfoncement).
  primaire: 'laiton-poli',
  // Un filet de craie de 2 px, et rien d'autre : sur une fiche, un bouton
  // secondaire est un cadre, pas un objet en relief.
  secondaire: 'border-2 border-craie/55 text-craie active:bg-craie active:text-feutre',
  discret: 'text-craie-3 active:text-craie',
  danger: 'border-2 border-rouge-cible text-rouge-cible active:bg-rouge-cible active:text-craie',
}

/** L'interlettrage vit dans la taille, sans classe concurrente par `className`. */
const TAILLES: Record<Taille, string> = {
  xs: 'min-h-14 px-3 text-xs tracking-[0.12em]',
  sm: 'min-h-14 px-3 text-sm tracking-[0.14em]',
  md: 'min-h-12 px-5 text-base tracking-widest',
  lg: 'min-h-14 px-7 text-lg tracking-widest',
}

export const classesBouton = (variante: Variante = 'primaire', taille: Taille = 'md'): string =>
  [
    'inline-flex items-center justify-center gap-2',
    'font-score font-bold uppercase',
    'transition-[transform,box-shadow,background-color] duration-100',
    'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
    TAILLES[taille],
    VARIANTES[variante],
  ].join(' ')

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variante?: Variante
  readonly taille?: Taille
  readonly children: ReactNode
}

export const Button = ({
  variante = 'primaire',
  taille = 'md',
  className = '',
  children,
  ...reste
}: Props) => (
  <button type="button" className={`${classesBouton(variante, taille)} ${className}`} {...reste}>
    {children}
  </button>
)
