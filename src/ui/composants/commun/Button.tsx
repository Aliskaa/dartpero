import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primaire' | 'secondaire' | 'discret' | 'danger'
type Taille = 'md' | 'lg'

/**
 * Cibles ≥ 48 px : on tape debout, une fléchette dans l'autre main.
 * `min-h-12` = 48 px, jamais descendre en dessous.
 */
const VARIANTES: Record<Variante, string> = {
  // Le laiton porte son relief dans `.laiton-poli` (biseau, reflet, enfoncement).
  primaire: 'laiton-poli',
  // Un filet de craie de 2 px, et rien d'autre : sur une fiche, un bouton
  // secondaire est un cadre, pas un objet en relief.
  secondaire: 'border-2 border-craie/55 text-craie active:bg-craie active:text-feutre',
  discret: 'text-craie/70 active:text-craie',
  danger: 'border-2 border-rouge-cible text-rouge-cible active:bg-rouge-cible active:text-craie',
}

const TAILLES: Record<Taille, string> = {
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-14 px-7 text-lg',
}

export const classesBouton = (variante: Variante = 'primaire', taille: Taille = 'md'): string =>
  [
    'inline-flex items-center justify-center gap-2',
    'font-score font-bold uppercase tracking-widest',
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
