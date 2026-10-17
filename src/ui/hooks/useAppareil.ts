import { useCallback, useEffect, useState } from 'react'
import type { Annonce } from '@/core/application/ports/driven/Announcer'
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
 * La date du dernier export réussi (horodatage de `services.clock`).
 * Préférence d'appareil : jamais dans le fichier exporté, jamais écrite par une
 * restauration. ⚠️ La clé est citée par la politique de confidentialité et ne
 * se renomme jamais (précédent `installation:ecartee`).
 */
export const CLE_DERNIER_EXPORT = 'sauvegarde:dernier-export'

/**
 * Un horodatage lisible, ou rien : la valeur relue n'a pas de schéma. Fini ne
 * suffit pas — `1e20` l'est, mais sort de la plage de `Date` (± 8,64 × 10¹⁵ ms).
 */
const horodatageOuNull = (valeur: unknown): number | null =>
  typeof valeur === 'number' && Number.isFinite(new Date(valeur).getTime()) ? valeur : null

/**
 * La date du dernier export, validée : une valeur éditée à la main ou
 * illisible vaut « Jamais », elle n'est jamais affichée brute.
 */
export const useDernierExport = (): readonly [number | null, (horodatage: number) => void] => {
  const [valeur, ecrire] = usePreference<unknown>(CLE_DERNIER_EXPORT, null)
  const noter = useCallback((horodatage: number) => ecrire(horodatage), [ecrire])
  return [horodatageOuNull(valeur), noter] as const
}

/**
 * Annonce une phrase, si l'utilisateur a laissé la voix active.
 *
 * ⚠️ La préférence est relue à **chaque** annonce plutôt que capturée au
 * montage : sans ça, couper la voix depuis les réglages ne ferait effet qu'à la
 * partie suivante. Le port reçoit des segments déjà écrits et étiquetés par
 * langue (voir `labels.ts`) — l'adapter ne fait que les prononcer.
 */
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
