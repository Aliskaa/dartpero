import { useCallback, useEffect, useRef, useState } from 'react'
import type { StorageProtection } from '@/core/application/ports/driven/PersistentStorage'
import { useServices } from '../providers/ServicesProvider'

/**
 * Demande la protection du stockage au démarrage, une seule fois, sans rien
 * afficher ni bloquer le rendu : la promesse n'est pas attendue.
 *
 * Le `useRef` tient l'unicité sous `StrictMode`, qui rejoue les effets.
 */
export const useDemandeStockageAuDemarrage = (): void => {
  const { devices } = useServices()
  const lance = useRef(false)

  useEffect(() => {
    if (lance.current) return
    lance.current = true
    const stockage = devices.persistentStorage
    void (async () => {
      if ((await stockage.status()) !== 'persisted') await stockage.request()
    })()
  }, [devices])
}

/**
 * L'état de la protection pour les Réglages. `etat` vaut `null` tant que
 * `status()` n'a pas répondu. `redemander` applique la valeur de retour de
 * `request()` : pas de rechargement, pas de TanStack Query — c'est une
 * capacité d'appareil, pas une lecture de données.
 */
export const useProtectionStockage = (): {
  readonly etat: StorageProtection | null
  readonly redemander: () => Promise<void>
  /** Une redemande faite par l'utilisateur vient d'être refusée (jamais vrai au montage). */
  readonly refusee: boolean
} => {
  const { devices } = useServices()
  const [etat, setEtat] = useState<StorageProtection | null>(null)
  const [refusee, setRefusee] = useState(false)

  useEffect(() => {
    let actif = true
    void devices.persistentStorage.status().then((valeur) => {
      if (actif) setEtat(valeur)
    })
    return () => {
      actif = false
    }
  }, [devices])

  const redemander = useCallback(async () => {
    const valeur = await devices.persistentStorage.request()
    setEtat(valeur)
    setRefusee(valeur !== 'persisted')
  }, [devices])

  return { etat, redemander, refusee }
}
