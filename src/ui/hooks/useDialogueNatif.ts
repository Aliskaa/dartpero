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

/** La discipline du `<dialog>` natif de `Modale` et `FeuilleRegles`. ⚠️ Monté en permanence, un seul effet sans nettoyage (`StrictMode`). */
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
