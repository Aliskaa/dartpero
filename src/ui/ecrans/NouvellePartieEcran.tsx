import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { X01Config } from '@/core/domain/entities/Match'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { CLE_JOUEURS, useJoueurs } from '@/ui/hooks/useJoueurs'
import { useServices } from '@/ui/providers/ServicesProvider'

const SCORES = [301, 501, 701] as const
const BEST_OF = [1, 3, 5, 7] as const
const MAX_JOUEURS = 4

const Choix = <T extends string | number>({
  legende,
  valeurs,
  valeur,
  onChange,
}: {
  readonly legende: string
  readonly valeurs: readonly T[]
  readonly valeur: T
  readonly onChange: (valeur: T) => void
}) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="font-score text-xs uppercase tracking-widest text-craie/70">
      {legende}
    </legend>
    <div className="flex gap-2">
      {valeurs.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === valeur}
          onClick={() => onChange(option)}
          className={[
            'chiffres min-h-12 flex-1 rounded-xl text-lg font-bold',
            option === valeur ? 'laiton-poli' : 'ardoise-craie text-craie',
          ].join(' ')}
        >
          {option}
        </button>
      ))}
    </div>
  </fieldset>
)

const Bascule = ({
  libelle,
  actif,
  onChange,
}: {
  readonly libelle: string
  readonly actif: boolean
  readonly onChange: (actif: boolean) => void
}) => (
  <button
    type="button"
    aria-pressed={actif}
    onClick={() => onChange(!actif)}
    className="ardoise-craie flex min-h-12 items-center justify-between rounded-xl px-4"
  >
    <span className="font-score text-sm uppercase tracking-widest text-craie">{libelle}</span>
    <span
      className={`font-score text-sm font-bold uppercase ${actif ? 'text-vert-cible' : 'text-craie/50'}`}
    >
      {actif ? 'Activé' : 'Désactivé'}
    </span>
  </button>
)

export const NouvellePartieEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const joueurs = useJoueurs()

  const [selection, setSelection] = useState<readonly PlayerId[]>([])
  const [nouveauNom, setNouveauNom] = useState('')
  const [score, setScore] = useState<(typeof SCORES)[number]>(501)
  const [bestOf, setBestOf] = useState<(typeof BEST_OF)[number]>(3)
  const [doubleOut, setDoubleOut] = useState(true)
  const [doubleIn, setDoubleIn] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  const basculer = (id: PlayerId) =>
    setSelection((actuelle) =>
      actuelle.includes(id)
        ? actuelle.filter((autre) => autre !== id)
        : actuelle.length >= MAX_JOUEURS
          ? actuelle
          : [...actuelle, id],
    )

  const ajouterJoueur = async () => {
    const nom = nouveauNom.trim()
    if (nom === '') return
    setErreur(null)
    try {
      const joueur = await services.managePlayers.create(nom)
      await queryClient.invalidateQueries({ queryKey: CLE_JOUEURS })
      setNouveauNom('')
      basculer(joueur.id)
    } catch {
      setErreur('Ce pseudo n’est pas valide.')
    }
  }

  const commencer = async () => {
    setErreur(null)
    setOccupe(true)
    try {
      const matchId = await services.startMatch.execute({
        playerIds: selection,
        config: X01Config.create({
          startingScore: score,
          legsToWin: X01Config.legsForBestOf(bestOf),
          doubleOut,
          doubleIn,
        }),
      })
      await queryClient.invalidateQueries({ queryKey: ['matchEnCours'] })
      navigate(`/partie/${matchId}`)
    } catch {
      setErreur('Impossible de démarrer la partie.')
      setOccupe(false)
    }
  }

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link to="/" className="font-score text-sm uppercase tracking-widest text-craie/70">
          ← Accueil
        </Link>
        <h1 className="font-display text-2xl text-laiton">Nouvelle partie</h1>
      </header>

      <section aria-label="Joueurs" className="flex flex-col gap-3">
        <p className="font-score text-xs uppercase tracking-widest text-craie/70">
          Joueurs ({selection.length}/{MAX_JOUEURS})
        </p>

        {joueurs.isPending ? (
          <Spinner label="Chargement des profils…" />
        ) : (
          <ul className="flex flex-col gap-2">
            {(joueurs.data ?? []).map((joueur) => {
              const choisi = selection.includes(joueur.id)
              return (
                <li key={joueur.id}>
                  <button
                    type="button"
                    aria-pressed={choisi}
                    onClick={() => basculer(joueur.id)}
                    className={[
                      'flex min-h-12 w-full items-center justify-between rounded-xl px-4',
                      choisi ? 'ardoise-craie ring-2 ring-laiton' : 'ardoise-craie',
                    ].join(' ')}
                  >
                    <span className="text-craie">{joueur.name}</span>
                    <span className="font-score text-sm text-laiton">
                      {choisi ? `n°${selection.indexOf(joueur.id) + 1}` : '+'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            aria-label="Nouveau joueur"
            placeholder="Ajouter un joueur"
            value={nouveauNom}
            onChange={(evenement) => setNouveauNom(evenement.target.value)}
            className="ardoise-craie min-h-12 flex-1 rounded-xl px-4 text-craie placeholder:text-craie/40"
          />
          <Button
            variante="secondaire"
            disabled={nouveauNom.trim() === ''}
            onClick={() => void ajouterJoueur()}
          >
            Ajouter
          </Button>
        </div>
      </section>

      <Choix legende="Score de départ" valeurs={SCORES} valeur={score} onChange={setScore} />
      <Choix legende="Best of (legs)" valeurs={BEST_OF} valeur={bestOf} onChange={setBestOf} />

      <div className="flex flex-col gap-2">
        <Bascule libelle="Double out" actif={doubleOut} onChange={setDoubleOut} />
        <Bascule libelle="Double in" actif={doubleIn} onChange={setDoubleIn} />
      </div>

      {erreur && <MessageErreur>{erreur}</MessageErreur>}

      <Button
        className="mt-auto w-full"
        disabled={selection.length === 0 || occupe}
        onClick={() => void commencer()}
      >
        Commencer
      </Button>
    </main>
  )
}
