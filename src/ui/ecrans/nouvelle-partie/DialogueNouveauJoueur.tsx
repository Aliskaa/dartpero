import { useEffect, useId, useRef, useState } from 'react'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { Button } from '@/ui/composants/commun/Button'
import { ChoixGenre, libelleGenre } from '@/ui/composants/commun/ChoixGenre'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import {
  erreurPseudo,
  LEGENDE_GENRE,
  LIBELLE_ANNULER,
  LIBELLE_MODIFIER,
  LIBELLE_NOUVEAU_JOUEUR,
  LIBELLE_PSEUDO,
  LIBELLE_TERMINE,
} from '@/ui/labels'

/** Longueur maximale d'un pseudo : confort de saisie, la règle reste dans le domaine (`Player.cleanName`). */
const LONGUEUR_MAX_PSEUDO = 20

/** Crée le profil (`undefined` = genre non précisé) ; lève l'erreur du domaine, la boîte reste ouverte. */
export type CreerJoueur = (nom: string, genre: PlayerGender | undefined) => Promise<void>

type Props = {
  readonly ouvert: boolean
  readonly onFermer: () => void
  readonly onCreer: CreerJoueur
}

/** La ligne repliée « Genre » : ouverte, elle reste en tête ; un choix ne la referme pas. */
const LigneGenre = ({
  genre,
  ouverte,
  idEtiquette,
  onBasculer,
}: {
  readonly genre: PlayerGender | undefined
  readonly ouverte: boolean
  readonly idEtiquette: string
  readonly onBasculer: () => void
}) => {
  const idValeur = useId()
  return (
    <button
      type="button"
      aria-expanded={ouverte}
      aria-labelledby={`${idEtiquette} ${idValeur}`}
      onClick={onBasculer}
      className="flex min-h-12 w-full items-center justify-between gap-3 border border-craie/30 px-3.5 text-left active:bg-craie/10"
    >
      <span
        id={idValeur}
        className="font-score text-sm uppercase tracking-[0.06em] text-craie-vive"
      >
        {libelleGenre(genre)}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm text-craie-2">
        {LIBELLE_MODIFIER}
        <span aria-hidden="true">▾</span>
      </span>
    </button>
  )
}

/** « Nouveau joueur » : un `<dialog>` natif ; `onClose` resynchronise l'état quand le navigateur ferme (Échap). */
export const DialogueNouveauJoueur = ({ ouvert, onFermer, onCreer }: Props) => {
  const boite = useRef<HTMLDialogElement>(null)
  const champ = useRef<HTMLInputElement>(null)
  const idTitre = useId()
  const idChamp = useId()
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const idGenre = useId()
  const [genre, setGenre] = useState<PlayerGender | undefined>(undefined)
  const [genreOuvert, setGenreOuvert] = useState(false)

  useEffect(() => {
    const dialogue = boite.current
    if (!dialogue) return
    if (ouvert && !dialogue.open) {
      setNom('')
      setErreur(null)
      // Chaque ouverture repart de « non précisé », ligne repliée.
      setGenre(undefined)
      setGenreOuvert(false)
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
      await onCreer(nom, genre)
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
            className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3"
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

        <div className="flex flex-col gap-1.5">
          <span
            id={idGenre}
            className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3"
          >
            {LEGENDE_GENRE}
          </span>
          <LigneGenre
            genre={genre}
            ouverte={genreOuvert}
            idEtiquette={idGenre}
            onBasculer={() => setGenreOuvert(!genreOuvert)}
          />
          {genreOuvert && <ChoixGenre valeur={genre} onChange={setGenre} legendeVisible={false} />}
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
