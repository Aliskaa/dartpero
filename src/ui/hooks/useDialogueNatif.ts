import {
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type SyntheticEvent,
  useEffect,
  useRef,
} from 'react'

/** Le point est-il hors de la boîte du `<dialog>` — donc sur le voile ? */
const surLeVoile = (dialogue: HTMLDialogElement, x: number, y: number): boolean => {
  const boite = dialogue.getBoundingClientRect()
  return x < boite.left || x > boite.right || y < boite.top || y > boite.bottom
}

/**
 * La discipline d'un `<dialog>` natif ouvert par `showModal()` — couche
 * supérieure, fond inerte, `::backdrop` et Échap viennent du navigateur.
 * Partagée par `Modale` (Statistiques) et `FeuilleRegles` (lot
 * `regles-du-jeu`, Révision 1) : un seul exemplaire des pièges.
 *
 * L'état « ouvert » ne vit pas ici : il vient de l'historique
 * (`useModaleAuRetour`), et **toute** fermeture passe par `onFermer`, qui
 * recule d'une entrée.
 *
 * ⚠️ Pièges tenus ici :
 * - le `<dialog>` est **monté en permanence** par l'appelant, son contenu
 *   seulement ouvert ;
 * - **un seul effet, sans nettoyage qui ferme** : sous `StrictMode`, un
 *   nettoyage refermerait la boîte rouverte après un rechargement ;
 * - `cancel` (Échap, retour sur Chrome Android) est annulé puis relayé à
 *   `onFermer` ; un `close` du navigateur pendant qu'on est encore ouvert
 *   aussi. Un `close` provoqué par nous (`ouvert` passé à faux) ne relaie rien ;
 * - focus : sur ✕ à l'ouverture (explicite : le polyfill jsdom ne le fait
 *   pas) ; à la fermeture, rendu à `retour` s'il est donné, sinon à l'élément
 *   d'origine — **seulement après une ouverture faite ici**, sinon le bouton
 *   `retour` prendrait le focus à chaque montage. `retour` existe pour
 *   Safari, qui ne donne pas le focus à un bouton touché : l'origine y
 *   serait `body` ;
 * - un appui à côté ferme : il arrive au `<dialog>` lui-même, et l'on ne
 *   ferme que s'il **commence et finit** hors de sa boîte (`pointerdown` puis
 *   `click`, coordonnées contre `getBoundingClientRect()`). Un appui sur la
 *   bordure ou un glisser parti du contenu ne ferme pas.
 */
export const useDialogueNatif = (
  ouvert: boolean,
  onFermer: () => void,
  retour?: RefObject<HTMLElement | null>,
) => {
  const boite = useRef<HTMLDialogElement>(null)
  const croix = useRef<HTMLButtonElement>(null)
  const origine = useRef<HTMLElement | null>(null)
  /** Une ouverture faite par ce hook attend sa fermeture (et le focus à rendre). */
  const ouvertParNous = useRef(false)
  /** L'appui en cours a-t-il commencé sur le voile ? */
  const appuiSurVoile = useRef(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: `retour` est une référence stable, lue au moment de la fermeture
  useEffect(() => {
    const dialogue = boite.current
    if (!dialogue) return
    if (ouvert && !dialogue.open) {
      const actif = document.activeElement
      origine.current = actif instanceof HTMLElement && actif !== document.body ? actif : null
      ouvertParNous.current = true
      dialogue.showModal()
      croix.current?.focus()
      return
    }
    if (!ouvert) {
      if (dialogue.open) dialogue.close()
      if (!ouvertParNous.current) return
      ouvertParNous.current = false
      const cible = retour?.current ?? origine.current
      origine.current = null
      if (cible?.isConnected) cible.focus({ preventScroll: true })
    }
  }, [ouvert])

  const surAnnulation = (evenement: SyntheticEvent<HTMLDialogElement>) => {
    evenement.preventDefault()
    onFermer()
  }

  const surFermeture = () => {
    if (ouvert) onFermer()
  }

  const surAppui = (evenement: PointerEvent<HTMLDialogElement>) => {
    const dialogue = evenement.currentTarget
    appuiSurVoile.current =
      evenement.target === dialogue && surLeVoile(dialogue, evenement.clientX, evenement.clientY)
  }

  const surClic = (evenement: MouseEvent<HTMLDialogElement>) => {
    const dialogue = evenement.currentTarget
    const commenceSurVoile = appuiSurVoile.current
    appuiSurVoile.current = false
    if (
      ouvert &&
      commenceSurVoile &&
      evenement.target === dialogue &&
      surLeVoile(dialogue, evenement.clientX, evenement.clientY)
    ) {
      onFermer()
    }
  }

  return { boite, croix, surAnnulation, surFermeture, surAppui, surClic }
}
