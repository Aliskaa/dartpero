import { useCallback, useEffect, useState } from 'react'
import { useServices } from '../providers/ServicesProvider'

/**
 * Garde l'écran allumé tant que le composant est monté et `actif` vrai.
 * Sans ça, le téléphone posé contre le mur s'éteint entre deux volées.
 */
export const useWakeLock = (actif: boolean): void => {
  const { devices } = useServices()

  useEffect(() => {
    if (!actif) return
    void devices.screenLock.request()
    return () => {
      void devices.screenLock.release()
    }
  }, [actif, devices])
}

/** Une préférence locale, lue au premier rendu et réécrite à chaque changement. */
export const usePreference = <T>(cle: string, defaut: T): readonly [T, (valeur: T) => void] => {
  const { devices } = useServices()
  const [valeur, setValeur] = useState<T>(() => devices.preferences.read(cle, defaut))

  const ecrire = useCallback(
    (nouvelle: T) => {
      devices.preferences.write(cle, nouvelle)
      setValeur(nouvelle)
    },
    [devices, cle],
  )

  return [valeur, ecrire] as const
}
