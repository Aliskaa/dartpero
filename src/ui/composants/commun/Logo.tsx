import { LIBELLE_COMPTEUR_FLECHETTES } from '@/ui/labels'
import { Cible } from './Cible'

/**
 * L'enseigne du pub. Le mot est en laiton brossé (dégradé clippé sur le texte),
 * posé sur son ombre portée comme une plaque vissée au mur.
 */
export const Enseigne = ({ className = '' }: { readonly className?: string }) => (
  <span
    className={[
      'bg-gradient-to-b from-laiton-clair via-laiton to-laiton-sombre bg-clip-text',
      'font-display text-transparent',
      'drop-shadow-[0_3px_0_var(--ombre-plaque)]',
      className,
    ].join(' ')}
  >
    Dartpéro
  </span>
)

/**
 * Le bloc d'accueil : la cible tourne lentement derrière l'enseigne, comme un
 * néon de bar. Assez lent pour ne jamais distraire pendant qu'on lit.
 */
export const LogoHero = () => (
  <div className="relative flex flex-col items-center">
    <div className="pointer-events-none absolute -top-6 flex w-full justify-center opacity-[var(--voile-cible)]">
      {/* Pas de `blur` ici : un filtre sur un SVG en rotation continue force un
          repaint à chaque image, et l'app doit rester fluide sur vieux mobile. */}
      <Cible className="size-56 animate-tourner-lent" avecNumeros />
    </div>

    <div className="relative flex flex-col items-center pt-10">
      <p className="font-score text-[0.65rem] uppercase tracking-[0.42em] text-craie/70">
        {LIBELLE_COMPTEUR_FLECHETTES}
      </p>
      <h1 className="mt-1">
        <Enseigne className="text-6xl" />
      </h1>
      <div className="filet-laiton mt-3 h-px w-44" />
    </div>
  </div>
)
