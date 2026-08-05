import { useEffect, useState } from 'react'

export type MomentCelebratifData = {
  /** Change → rejoue l'animation (typiquement un timestamp + type). */
  readonly cle: string
  readonly titre: string
  readonly detail?: string
}

type Props = {
  readonly moment: MomentCelebratifData | null
  /** Durée d'affichage ; assez court pour ne pas gêner la volée suivante. */
  readonly dureeMs?: number
}

/**
 * Bandeau de récompense — checkout, leg, set, match.
 *
 * ⚠️ `pointer-events-none` : il ne doit jamais bloquer le pavé. Il vit hors de
 * la saisie, disparaît tout seul, et `prefers-reduced-motion` coupe l'éclat.
 */
export const MomentCelebratif = ({ moment, dureeMs = 2200 }: Props) => {
  const [affiche, setAffiche] = useState<MomentCelebratifData | null>(null)

  useEffect(() => {
    if (!moment) return
    setAffiche(moment)
    const timer = window.setTimeout(() => setAffiche(null), dureeMs)
    return () => window.clearTimeout(timer)
  }, [moment, dureeMs])

  if (!affiche) return null

  return (
    <div
      key={affiche.cle}
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-none relative overflow-hidden rounded-xl',
        'border border-vert-cible/55 bg-vert-cible/18 px-4 py-3 text-center',
        'shadow-[0_0_28px_-8px_var(--color-vert-cible)]',
        'animate-monter',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-vert-cible/50 to-transparent animate-eclat"
      />
      <p className="relative font-score text-lg font-bold uppercase tracking-[0.28em] text-vert-cible">
        {affiche.titre}
      </p>
      {affiche.detail && (
        <p className="relative mt-0.5 font-score text-sm uppercase tracking-wider text-craie/80">
          {affiche.detail}
        </p>
      )}
    </div>
  )
}
