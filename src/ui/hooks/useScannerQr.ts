import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useServices } from '../providers/ServicesProvider'

/** Le lecteur de QR des appareils. ⚠️ `demarrer` seulement dans un clic (iOS) ; arrêté en quittant l'écran. */
export const useScannerQr = () => {
  const { devices } = useServices()
  const scanner = devices.qrScanner
  const abonner = useCallback((surChange: () => void) => scanner.subscribe(surChange), [scanner])
  const lire = useCallback(() => scanner.state(), [scanner])
  const etat = useSyncExternalStore(abonner, lire, lire)

  useEffect(() => () => scanner.stop(), [scanner])

  const demarrer = useCallback(
    (viseur: HTMLVideoElement | null) => {
      if (viseur) scanner.start(viseur)
    },
    [scanner],
  )
  const arreter = useCallback(() => scanner.stop(), [scanner])

  return { etat, demarrer, arreter }
}
