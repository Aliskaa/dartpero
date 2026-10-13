import { LIBELLE_COMPTEUR_FLECHETTES } from '@/ui/labels'
import { Cible } from './Cible'

/**
 * L'enseigne du pub. Le mot est en laiton plein, posé sur son ombre portée
 * comme une plaque vissée au mur.
 */
export const Enseigne = ({ className = '' }: { readonly className?: string }) => (
  <span
    className={[
      'font-display text-laiton',
      'drop-shadow-[0_3px_0_var(--ombre-plaque)]',
      className,
    ].join(' ')}
  >
    Dartpéro
  </span>
)

/**
 * Le bloc d'accueil : la cible fait un tour derrière l'enseigne à l'ouverture,
 * puis se pose. Elle ne tourne plus en boucle : rien ne distrait pendant qu'on lit.
 */
export const LogoHero = () => (
  <div className="relative flex flex-col items-center">
    <div className="pointer-events-none absolute -top-6 flex w-full justify-center opacity-[var(--voile-cible)]">
      {/* Pas de `blur` ici : un filtre sur un SVG en rotation force un repaint
          à chaque image, et l'app doit rester fluide sur vieux mobile. */}
      <Cible className="size-56 animate-tour-logo" avecNumeros />
    </div>

    <div className="relative flex flex-col items-center pt-10">
      <p className="font-score text-etiquette uppercase tracking-[0.42em] text-craie-3">
        {LIBELLE_COMPTEUR_FLECHETTES}
      </p>
      <h1 className="mt-1">
        <Enseigne className="text-6xl" />
      </h1>
      <div className="filet-laiton mt-3 h-px w-44" />
    </div>
  </div>
)
