import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import {
  erreurPseudo,
  LIBELLE_ANNULER,
  LIBELLE_NOUVEAU_JOUEUR,
  LIBELLE_PSEUDO,
  LIBELLE_TERMINE,
} from '@/ui/labels'

/**
 * La longueur maximale d'un pseudo — un confort de saisie seulement. La règle,
 * elle, reste dans le domaine (`Player.cleanName`, 20 caractères), qui est le
 * seul à valider.
 */
const LONGUEUR_MAX_PSEUDO = 20

type Props = {
  readonly ouvert: boolean
  readonly onFermer: () => void
  /** Lève l'erreur du domaine en cas d'échec : la boîte reste alors ouverte. */
  readonly onCreer: (nom: string) => Promise<void>
}

/**
 * « Nouveau joueur » : un champ, « Annuler » / « Terminé ».
 *
 * Un `<dialog>` natif ouvert par `showModal()` : couche supérieure, fond
 * inerte, Échap et `::backdrop` viennent du navigateur, sans piège à focus
 * réécrit à la main. `onClose` resynchronise l'état quand c'est le navigateur
 * qui ferme (Échap).
 */
export const DialogueNouveauJoueur = ({ ouvert, onFermer, onCreer }: Props) => {
  const boite = useRef<HTMLDialogElement>(null)
  const champ = useRef<HTMLInputElement>(null)
  const idTitre = useId()
  const idChamp = useId()
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  useEffect(() => {
    const dialogue = boite.current
    if (!dialogue) return
    if (ouvert && !dialogue.open) {
      setNom('')
      setErreur(null)
      dialogue.showModal()
      champ.current?.focus()
    } else if (!ouvert && dialogue.open) {
      dialogue.close()
    }
  }, [ouvert])

  const valider = async () => {
    if (nom.trim() === '' || occupe) return
    setErreur(null)
    setOccupe(true)
    try {
      await onCreer(nom)
      onFermer()
    } catch (cause) {
      setErreur(erreurPseudo(cause))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <dialog
      ref={boite}
      aria-labelledby={idTitre}
      onClose={onFermer}
      className={[
        'm-auto w-[min(calc(100%-2rem),24rem)] border-2 border-craie/35 bg-ardoise p-0 text-craie',
        'backdrop:bg-feutre-nuit/80',
      ].join(' ')}
    >
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={(evenement) => {
          evenement.preventDefault()
          void valider()
        }}
      >
        <h2 id={idTitre} className="entete-colonne text-laiton">
          {LIBELLE_NOUVEAU_JOUEUR}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={idChamp}
            className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65"
          >
            {LIBELLE_PSEUDO}
          </label>
          <input
            id={idChamp}
            ref={champ}
            value={nom}
            maxLength={LONGUEUR_MAX_PSEUDO}
            autoComplete="off"
            onChange={(evenement) => setNom(evenement.target.value)}
            className="min-h-12 border border-chene/60 bg-feutre/70 px-4 text-craie"
          />
        </div>

        {erreur && <MessageErreur>{erreur}</MessageErreur>}

        <div className="grid grid-cols-2 gap-2">
          <Button variante="secondaire" onClick={onFermer}>
            {LIBELLE_ANNULER}
          </Button>
          <Button type="submit" disabled={nom.trim() === '' || occupe}>
            {LIBELLE_TERMINE}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
