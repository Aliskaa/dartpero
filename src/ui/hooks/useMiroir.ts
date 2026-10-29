import { useCallback, useSyncExternalStore } from 'react'
import type { MirrorView } from '@/core/application/ports/driving/WatchMatch'
import { useServices } from '../providers/ServicesProvider'
import { useApresDelai } from './usePartage'

/** La session du miroir, lue en direct. ⚠️ Muette par construction : ni voix, ni vibration, ni dépôt. */
export const useMiroir = () => {
  const { watchMatch } = useServices()
  const abonner = useCallback(
    (surChange: () => void) => watchMatch.subscribe(surChange),
    [watchMatch],
  )
  const lire = useCallback(() => watchMatch.state(), [watchMatch])
  const etat = useSyncExternalStore(abonner, lire, lire)

  /** Une coupure de moins de 5 s n'affiche rien : la dernière image reste, sans bandeau. */
  const perduAffiche = useApresDelai(etat.status === 'lost')
  const vue: MirrorView | null = 'view' in etat ? etat.view : null

  return { etat, vue, perduAffiche, session: watchMatch }
}
