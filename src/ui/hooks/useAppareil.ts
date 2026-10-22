import { useCallback, useEffect, useState } from 'react'
import type { Annonce } from '@/core/application/ports/driven/Announcer'
import { useServices } from '../providers/ServicesProvider'
import { appliquerTheme, CLE_THEME, ecouterThemeSysteme, THEME_DEFAUT, type Theme } from '../theme'

/** Garde l'écran allumé tant que le composant est monté et `actif` vrai. */
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

/** La clé de préférence de l'annonce vocale, partagée par le jeu et les réglages. */
export const CLE_VOIX = 'annonce-vocale'

/** Date du dernier export réussi. ⚠️ Clé citée par la politique de confidentialité : ne se renomme jamais. */
export const CLE_DERNIER_EXPORT = 'sauvegarde:dernier-export'

/** Un horodatage lisible, ou rien. ⚠️ Fini ne suffit pas : `1e20` sort de la plage de `Date`. */
const horodatageOuNull = (valeur: unknown): number | null =>
  typeof valeur === 'number' && Number.isFinite(new Date(valeur).getTime()) ? valeur : null

/** La date du dernier export, validée ; une valeur illisible vaut « Jamais ». */
export const useDernierExport = (): readonly [number | null, (horodatage: number) => void] => {
  const [valeur, ecrire] = usePreference<unknown>(CLE_DERNIER_EXPORT, null)
  const noter = useCallback((horodatage: number) => ecrire(horodatage), [ecrire])
  return [horodatageOuNull(valeur), noter] as const
}

/** Annonce une phrase si la voix est active. ⚠️ Préférence relue à chaque annonce, pas capturée au montage. */
export const useVoix = (): ((annonce: Annonce) => void) => {
  const { devices } = useServices()

  return useCallback(
    (annonce: Annonce) => {
      if (!devices.preferences.read(CLE_VOIX, true)) return
      devices.announcer.say(annonce)
    },
    [devices],
  )
}

/**
 * Applique le thème enregistré, puis suit le système tant que « Système » est choisi.
 * ⚠️ Préférence relue à chaque bascule du système, jamais capturée en état.
 */
export const useThemeSysteme = (): void => {
  const { devices } = useServices()

  useEffect(() => {
    const poser = () => appliquerTheme(devices.preferences.read<Theme>(CLE_THEME, THEME_DEFAUT))
    poser()
    return ecouterThemeSysteme(poser)
  }, [devices])
}
