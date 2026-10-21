import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { PLAYER_COLORS, type PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { ChoixGenre } from '@/ui/composants/commun/ChoixGenre'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { COULEURS, NOM_COULEUR } from '@/ui/couleurs'
import { useJoueurs, useRafraichirJoueurs } from '@/ui/hooks/useJoueurs'
import { dateCourte } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Ce que la carte en édition enregistre. `gender: null` retire le genre. */
type ChangementsProfil = {
  readonly name: string
  readonly color: PlayerColor
  readonly gender: PlayerGender | null
}

/** La palette, en pastilles : on choisit une couleur en la voyant, pas en la lisant. */
const ChoixCouleur = ({
  valeur,
  onChange,
}: {
  readonly valeur: PlayerColor
  readonly onChange: (couleur: PlayerColor) => void
}) => (
  <fieldset className="flex flex-wrap gap-2">
    <legend className="sr-only">Couleur du profil</legend>
    {PLAYER_COLORS.map((couleur) => {
      const choisie = couleur === valeur
      return (
        <button
          key={couleur}
          type="button"
          aria-label={NOM_COULEUR[couleur]}
          aria-pressed={choisie}
          onClick={() => onChange(couleur)}
          style={{ backgroundColor: COULEURS[couleur].fond, borderColor: COULEURS[couleur].bord }}
          className={[
            'flex size-11 items-center justify-center border-2 transition-transform',
            choisie ? 'scale-110 ring-2 ring-laiton ring-offset-2 ring-offset-ardoise' : '',
          ].join(' ')}
        >
          {choisie && <Check aria-hidden="true" className="size-5 text-white drop-shadow" />}
        </button>
      )
    })}
  </fieldset>
)

/** Une carte de profil, qui se replie en formulaire quand on l'édite. */
const CarteProfil = ({
  joueur,
  onEnregistrer,
  onSupprimer,
}: {
  readonly joueur: Player
  readonly onEnregistrer: (changes: ChangementsProfil) => Promise<void>
  readonly onSupprimer: () => Promise<void>
}) => {
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState(joueur.name)
  const [couleur, setCouleur] = useState<PlayerColor>(joueur.color)
  // Le genre ne se montre qu'en édition (planche `genre-profil`) : la carte au repos ne change pas.
  const [genre, setGenre] = useState<PlayerGender | undefined>(joueur.gender)
  const [confirmeSuppression, setConfirmeSuppression] = useState(false)

  const ouvrir = () => {
    setNom(joueur.name)
    setCouleur(joueur.color)
    setGenre(joueur.gender)
    setConfirmeSuppression(false)
    setEdition(true)
  }

  if (!edition) {
    return (
      <li className="flex items-center gap-3 border border-chene/40 bg-ardoise px-3 py-2.5">
        <Avatar nom={joueur.name} couleur={joueur.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-score text-base uppercase tracking-wide text-craie">
            {joueur.name}
          </span>
          <span className="block text-xs text-craie-3">
            {joueur.createdAt > 0 ? `Depuis le ${dateCourte(joueur.createdAt)}` : 'Profil local'}
          </span>
        </span>
        <button
          type="button"
          aria-label={`Modifier ${joueur.name}`}
          onClick={ouvrir}
          className="touche flex size-11 shrink-0 items-center justify-center [--texte-touche:var(--color-craie-2)]"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </button>
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-3 border border-chene/40 bg-ardoise p-3">
      <div className="flex items-center gap-3">
        <Avatar nom={nom || joueur.name} couleur={couleur} />
        <input
          aria-label={`Pseudo de ${joueur.name}`}
          value={nom}
          maxLength={20}
          onChange={(evenement) => setNom(evenement.target.value)}
          className="min-h-12 min-w-0 flex-1 border border-chene/60 bg-feutre/70 px-3 font-score text-base uppercase tracking-wide text-craie"
        />
      </div>

      <ChoixCouleur valeur={couleur} onChange={setCouleur} />

      <ChoixGenre valeur={genre} onChange={setGenre} />

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Button
          disabled={nom.trim() === ''}
          onClick={async () => {
            // `null` = repasser à « non précisé » : la clé est retirée.
            await onEnregistrer({ name: nom, color: couleur, gender: genre ?? null })
            setEdition(false)
          }}
        >
          <Check aria-hidden="true" className="size-4" />
          Enregistrer
        </Button>

        <Button variante="secondaire" aria-label="Annuler" onClick={() => setEdition(false)}>
          <X aria-hidden="true" className="size-4" />
        </Button>

        {/* Suppression en deux temps : pas de fenêtre modale, mais pas non plus
            de profil effacé d'un doigt qui glisse. */}
        <Button
          variante="danger"
          aria-label={
            confirmeSuppression ? `Confirmer la suppression de ${joueur.name}` : 'Supprimer'
          }
          onClick={async () => {
            if (!confirmeSuppression) {
              setConfirmeSuppression(true)
              return
            }
            await onSupprimer()
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {confirmeSuppression && 'Sûr ?'}
        </Button>
      </div>

      {confirmeSuppression && (
        <p className="text-xs text-craie-3">
          Ses parties passées restent dans l’historique, mais son pseudo y sera remplacé par «
          Joueur supprimé ».
        </p>
      )}
    </li>
  )
}

export const JoueursEcran = () => {
  const services = useServices()
  const joueurs = useJoueurs()
  const rafraichir = useRafraichirJoueurs()

  const [nouveauNom, setNouveauNom] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const message = (cause: unknown) =>
    setErreur(
      cause instanceof Error && cause.message === 'Player name already taken'
        ? 'Ce pseudo est déjà pris.'
        : cause instanceof Error
          ? cause.message
          : 'Action impossible.',
    )

  const ajouter = async () => {
    if (nouveauNom.trim() === '') return
    setErreur(null)
    try {
      await services.managePlayers.create(nouveauNom)
      await rafraichir()
      setNouveauNom('')
    } catch (cause) {
      setErreur(
        cause instanceof Error && cause.message === 'Player name already taken'
          ? 'Ce pseudo est déjà pris.'
          : 'Ce pseudo n’est pas valide : 1 à 20 caractères.',
      )
    }
  }

  const enregistrer = async (id: PlayerId, changes: ChangementsProfil) => {
    setErreur(null)
    try {
      await services.managePlayers.update(id, changes)
      await rafraichir()
    } catch (cause) {
      message(cause)
    }
  }

  const supprimer = async (id: PlayerId) => {
    setErreur(null)
    try {
      await services.managePlayers.remove(id)
      await rafraichir()
    } catch (cause) {
      message(cause)
    }
  }

  const liste = joueurs.data ?? []

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre="Joueurs"
        sousTitre={`${liste.length} profil${liste.length > 1 ? 's' : ''} sur cet appareil`}
      />

      <div className="flex flex-col gap-4 px-4">
        <form
          className="flex gap-2"
          onSubmit={(evenement) => {
            evenement.preventDefault()
            void ajouter()
          }}
        >
          <input
            aria-label="Nouveau joueur"
            placeholder="Ajouter un joueur"
            value={nouveauNom}
            maxLength={20}
            onChange={(evenement) => setNouveauNom(evenement.target.value)}
            className="min-h-12 min-w-0 flex-1 border border-chene/60 bg-feutre/70 px-4 text-craie placeholder:text-craie-3"
          />
          <Button type="submit" disabled={nouveauNom.trim() === ''}>
            <UserPlus aria-hidden="true" className="size-4" />
            Ajouter
          </Button>
        </form>

        {erreur && <MessageErreur>{erreur}</MessageErreur>}

        {joueurs.isPending ? (
          <SpinnerLigne label="Chargement des profils…" />
        ) : liste.length === 0 ? (
          <EmptyState
            titre="Personne à l’oche"
            description="Créez un profil par joueur : leurs moyennes et leurs records les suivront de partie en partie."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {liste.map((joueur) => (
              <CarteProfil
                key={joueur.id}
                joueur={joueur}
                onEnregistrer={(changes) => enregistrer(joueur.id, changes)}
                onSupprimer={() => supprimer(joueur.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
