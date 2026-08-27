import { useCallback, useEffect, useState } from 'react'
import { useServices } from '../providers/ServicesProvider'
import { appliquerTheme, CLE_THEME, ecouterThemeSysteme, THEME_DEFAUT, type Theme } from '../theme'

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

/** La clé de préférence de l'annonce vocale, partagée par le jeu et les réglages. */
export const CLE_VOIX = 'annonce-vocale'

/**
 * Annonce une phrase, si l'utilisateur a laissé la voix active.
 *
 * ⚠️ La préférence est relue à **chaque** annonce plutôt que capturée au
 * montage : sans ça, couper la voix depuis les réglages ne ferait effet qu'à la
 * partie suivante. Le port reçoit du texte déjà écrit en français (voir
 * `labels.ts`) — l'adapter ne fait que le prononcer.
 */
export const useVoix = (): ((texte: string) => void) => {
  const { devices } = useServices()

  return useCallback(
    (texte: string) => {
      if (!devices.preferences.read(CLE_VOIX, true)) return
      devices.announcer.say(texte)
    },
    [devices],
  )
}

/**
 * Applique le thème enregistré au montage, puis suit le réglage système tant
 * que l'utilisateur a laissé « Système ».
 *
 * ⚠️ La préférence est **relue** à chaque bascule du système, jamais capturée
 * en état : sinon, choisir « Clair » depuis les Réglages laisserait cet
 * écouteur rappliquer l'ancien choix au prochain coucher de soleil. Même règle
 * que `useVoix`, qui relit la préférence à chaque annonce.
 *
 * Le premier rendu, lui, est déjà peint : le script d'amorçage de `index.html`
 * a posé l'attribut avant que le bundle ne se charge. Cet effet ne fait que
 * rattraper les cas où il n'a pas pu (navigation privée, `localStorage`
 * indisponible — le port retombe alors en mémoire).
 */
export const useThemeSysteme = (): void => {
  const { devices } = useServices()

  useEffect(() => {
    const poser = () => appliquerTheme(devices.preferences.read<Theme>(CLE_THEME, THEME_DEFAUT))
    poser()
    return ecouterThemeSysteme(poser)
  }, [devices])
}
