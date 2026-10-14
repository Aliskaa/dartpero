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
  /**
   * `bas` (défaut) : sur le bas de la feuille. `sous` : **sous** la feuille en
   * portrait, sur le vide qui la sépare du pavé, et sur son bas en paysage (où
   * ce vide n'existe pas). Pour une feuille dont la dernière ligne n'a pas de
   * pied : au Tour du monde, 44 px sur le bas de la dernière ligne en
   * masqueraient la cible et la volée.
   */
  readonly ancrage?: 'bas' | 'sous'
}

/**
 * Bandeau de récompense — checkout, leg, set, match.
 *
 * ⚠️ `pointer-events-none` : il ne doit jamais bloquer le pavé. Il vit hors de
 * la saisie, disparaît tout seul, et `prefers-reduced-motion` montre le filet déjà tracé, sans animation.
 *
 * ⚠️ **Hors du flux** : il est `absolute` au bas de son plus proche ancêtre
 * `relative`. L'écran enveloppe donc son tableau ET le moment dans un
 * `div.relative`, le moment en dernier enfant : il recouvre le bas de la feuille
 * (le ruban de sortie au X01, la ligne de volée au Cricket), n'ajoute aucune
 * hauteur et ne décale rien. **Une rangée de 44 px** : il ne masque plus la
 * ligne du joueur qui lance.
 *
 * ⚠️ On s'accroche à `moment.cle`, pas à l'objet : le parent recalcule un
 * nouvel objet à chaque rendu, et un effet sur la référence réafficherait le
 * leg précédent pendant tout le leg suivant.
 */
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
      {/* Le fond opaque (`bg-ardoise`, au-dessus) sert de sous-couche à la teinte
          verte : sans lui, le ruban de sortie transparaîtrait à travers. */}
      {/* UNE rangée de 44 px (`h-11`), pour les trois jeux : le titre, puis le
          détail s'il y en a un (« FERMÉE ! · 19 »). Le titre ne rétrécit jamais,
          le détail se tronque en dernier recours. */}
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
