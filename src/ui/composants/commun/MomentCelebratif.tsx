import { useEffect, useRef, useState } from 'react'

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
  /** `bas` : sur le bas de la feuille ; `sous` : sous la feuille en portrait, pour ne pas masquer la dernière ligne du Tour du monde. */
  readonly ancrage?: 'bas' | 'sous'
}

/** Bandeau de récompense hors du flux, `pointer-events-none`. ⚠️ Effet sur `moment.cle`, pas sur l'objet : le parent en recrée un à chaque rendu. */
export const MomentCelebratif = ({ moment, dureeMs = 2200, ancrage = 'bas' }: Props) => {
  const [affiche, setAffiche] = useState<MomentCelebratifData | null>(null)
  const cleVue = useRef<string | null>(null)
  const momentRef = useRef(moment)
  momentRef.current = moment

  const cle = moment?.cle ?? null

  useEffect(() => {
    if (cle === null) {
      setAffiche(null)
      return
    }

    // Même jalon déjà consommé : on ne le rejoue pas (re-renders du match).
    if (cleVue.current === cle) return

    const data = momentRef.current
    if (!data) return

    cleVue.current = cle
    setAffiche(data)
    const timer = window.setTimeout(() => setAffiche(null), dureeMs)
    return () => window.clearTimeout(timer)
  }, [cle, dureeMs])

  if (!affiche) return null

  return (
    <div
      key={affiche.cle}
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-none absolute inset-x-0 z-10 animate-monter bg-ardoise',
        ancrage === 'sous'
          ? 'top-full mt-2 paysage:top-auto paysage:bottom-0 paysage:mt-0'
          : 'bottom-0',
      ].join(' ')}
    >
      <div className="relative flex h-11 items-center justify-center gap-3 overflow-hidden border border-vert-cible/55 bg-vert-cible/18 px-3">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-trace-filet border-2 border-vert-cible"
        />
        <p className="relative shrink-0 font-score text-lg font-bold uppercase tracking-[0.28em] text-vert-cible">
          {affiche.titre}
        </p>
        {affiche.detail && (
          <>
            <span aria-hidden="true" className="relative shrink-0 text-craie-decor">
              ·
            </span>
            <p className="relative min-w-0 truncate font-score text-sm uppercase tracking-wider text-craie-2">
              {affiche.detail}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
