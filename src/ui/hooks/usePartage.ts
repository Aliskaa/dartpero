import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useServices } from '../providers/ServicesProvider'

/** Sous ce délai, une coupure ne s'affiche pas : la mesure a vu un lien se rétablir seul en 2,6 s. */
export const DELAI_PERTE_MS = 5000

/** Vrai quand `actif` l'est resté `delaiMs` d'affilée ; retombe aussitôt qu'il ne l'est plus. */
export const useApresDelai = (actif: boolean, delaiMs: number = DELAI_PERTE_MS): boolean => {
  const [echu, setEchu] = useState(false)

  useEffect(() => {
    setEchu(false)
    if (!actif) return
    const minuteur = window.setTimeout(() => setEchu(true), delaiMs)
    return () => window.clearTimeout(minuteur)
  }, [actif, delaiMs])

  return actif && echu
}

/** Ce que montre le voyant : rien sans partage, vert connecté, rouge après 5 s de coupure. */
export type VoyantPartage = 'connecte' | 'perdu' | null

/** La session de partage de la saisie, lue en direct (`useSyncExternalStore`). */
export const usePartage = () => {
  const { shareMatch } = useServices()
  const abonner = useCallback(
    (surChange: () => void) => shareMatch.subscribe(surChange),
    [shareMatch],
  )
  const lire = useCallback(() => shareMatch.state(), [shareMatch])
  const etat = useSyncExternalStore(abonner, lire, lire)

  const perdu = useApresDelai(etat.status === 'lost')
  const voyant: VoyantPartage =
    etat.status === 'connected' || (etat.status === 'lost' && !perdu)
      ? 'connecte'
      : perdu
        ? 'perdu'
        : null

  return { etat, voyant, session: shareMatch }
}
