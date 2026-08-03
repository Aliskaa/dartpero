import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Play, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Enseigne } from '@/ui/composants/commun/Logo'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { CLE_JOUEURS, useJoueurs } from '@/ui/hooks/useJoueurs'
import { useServices } from '@/ui/providers/ServicesProvider'

const SCORES = [301, 501, 701] as const
const BEST_OF = [1, 3, 5, 7] as const
const MAX_JOUEURS = 4

/**
 * Sélecteur segmenté : un rail d'ardoise, un curseur de laiton qui glisse
 * jusqu'à l'option retenue. Le mouvement dit le changement mieux qu'un
 * changement de couleur seul.
 */
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
}) => {
  const rang = Math.max(valeurs.indexOf(valeur), 0)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65">
        {legende}
      </legend>
      <div
        className="relative grid rounded-xl border border-chene/60 bg-feutre/70 p-1"
        style={{ gridTemplateColumns: `repeat(${valeurs.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          style={{
            width: `calc((100% - 0.5rem) / ${valeurs.length})`,
            transform: `translateX(${rang * 100}%)`,
          }}
          className="laiton-poli absolute inset-y-1 left-1 rounded-lg transition-transform duration-200 ease-out"
        />
        {valeurs.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === valeur}
            onClick={() => onChange(option)}
            className={`chiffres relative z-10 min-h-12 rounded-lg text-lg font-bold transition-colors duration-150 ${
              option === valeur ? 'text-[#1a1206]' : 'text-craie/75'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const MODES: readonly { readonly id: GameModeId; readonly libelle: string }[] = [
  { id: 'X01', libelle: 'X01' },
  { id: 'TOUR_DU_MONDE', libelle: 'Tour du monde' },
]

/**
 * Le mode de jeu, en premier : c'est lui qui décide de tout le reste de
 * l'écran, donc il se choisit avant.
 */
const ChoixMode = ({
  valeur,
  onChange,
}: {
  readonly valeur: GameModeId
  readonly onChange: (mode: GameModeId) => void
}) => {
  const rang = Math.max(
    MODES.findIndex((option) => option.id === valeur),
    0,
  )

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65">
        Jeu
      </legend>
      <div className="relative grid grid-cols-2 rounded-xl border border-chene/60 bg-feutre/70 p-1">
        <span
          aria-hidden="true"
          style={{
            width: 'calc((100% - 0.5rem) / 2)',
            transform: `translateX(${rang * 100}%)`,
          }}
          className="laiton-poli absolute inset-y-1 left-1 rounded-lg transition-transform duration-200 ease-out"
        />
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === valeur}
            onClick={() => onChange(option.id)}
            className={`relative z-10 min-h-12 rounded-lg font-score text-sm font-bold uppercase tracking-widest transition-colors duration-150 ${
              option.id === valeur ? 'text-[#1a1206]' : 'text-craie/75'
            }`}
          >
            {option.libelle}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Interrupteur de comptoir : la pastille de laiton glisse dans son rail. */
const Bascule = ({
  libelle,
  aide,
  actif,
  onChange,
}: {
  readonly libelle: string
  readonly aide: string
  readonly actif: boolean
  readonly onChange: (actif: boolean) => void
}) => (
  <button
    type="button"
    aria-pressed={actif}
    onClick={() => onChange(!actif)}
    className={[
      'flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 text-left',
      'transition-colors duration-150',
      actif ? 'border-laiton/50 bg-laiton/10' : 'border-chene/55 bg-feutre/60',
    ].join(' ')}
  >
    <span className="min-w-0">
      <span
        className={`block font-score text-sm font-bold uppercase tracking-widest ${
          actif ? 'text-laiton-clair' : 'text-craie/75'
        }`}
      >
        {libelle}
      </span>
      <span className="block truncate text-xs text-craie/60">{aide}</span>
    </span>

    <span
      aria-hidden="true"
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${
        actif ? 'border-laiton/60 bg-laiton/25' : 'border-craie/20 bg-black/40'
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full transition-all duration-200 ${
          actif ? 'laiton-poli left-[1.6rem]' : 'left-0.5 bg-craie/45'
        }`}
      />
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
  const [mode, setMode] = useState<GameModeId>('X01')
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
      const matchId =
        mode === 'TOUR_DU_MONDE'
          ? await services.playTourDuMonde.start({
              playerIds: selection,
              config: TourDuMondeConfig.create(),
            })
          : await services.startMatch.execute({
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
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Retour à l’accueil"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-chene/60 bg-ardoise text-craie/80 active:bg-chene/30"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="font-score text-[0.6rem] uppercase tracking-[0.3em] text-craie/60">
            Nouvelle partie
          </p>
          <Enseigne className="text-2xl" />
        </div>
      </header>

      <Panneau
        aria-label="Joueurs"
        titre="Joueurs"
        action={
          <span className="chiffres text-xs text-craie/60">
            {selection.length}/{MAX_JOUEURS}
          </span>
        }
        contenuClassName="flex flex-col gap-3 p-3"
      >
        {joueurs.isPending ? (
          <SpinnerLigne label="Chargement des profils…" />
        ) : (
          <ul className="flex flex-col gap-2">
            {(joueurs.data ?? []).map((joueur) => {
              const rang = selection.indexOf(joueur.id)
              const choisi = rang >= 0
              return (
                <li key={joueur.id}>
                  <button
                    type="button"
                    aria-pressed={choisi}
                    onClick={() => basculer(joueur.id)}
                    className={[
                      'flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left',
                      'transition-colors duration-150',
                      choisi
                        ? 'border-laiton/60 bg-laiton/10 shadow-[0_0_20px_-10px_var(--color-laiton)]'
                        : 'border-chene/55 bg-feutre/60',
                    ].join(' ')}
                  >
                    <Avatar nom={joueur.name} couleur={joueur.color} />
                    <span
                      className={`min-w-0 flex-1 truncate font-score text-base uppercase tracking-wide ${
                        choisi ? 'text-craie-vive' : 'text-craie/75'
                      }`}
                    >
                      {joueur.name}
                    </span>
                    {choisi ? (
                      <span className="chiffres flex size-7 shrink-0 items-center justify-center rounded-full border border-laiton/60 bg-laiton/20 text-xs font-bold text-laiton-clair">
                        n°{rang + 1}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-craie/20 text-craie/40"
                      >
                        +
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <form
          className="flex gap-2"
          onSubmit={(evenement) => {
            evenement.preventDefault()
            void ajouterJoueur()
          }}
        >
          <input
            aria-label="Nouveau joueur"
            placeholder="Ajouter un joueur"
            value={nouveauNom}
            onChange={(evenement) => setNouveauNom(evenement.target.value)}
            className={[
              'min-h-12 flex-1 rounded-xl border border-chene/60 bg-feutre/70 px-4',
              'text-craie placeholder:text-craie/40',
            ].join(' ')}
          />
          <Button variante="secondaire" type="submit" disabled={nouveauNom.trim() === ''}>
            <UserPlus aria-hidden="true" className="size-4" />
            Ajouter
          </Button>
        </form>
      </Panneau>

      <Panneau aria-label="Règles" titre="Règles" contenuClassName="flex flex-col gap-4 p-3">
        <ChoixMode valeur={mode} onChange={setMode} />

        {/* Le Tour du monde n'a rien à régler : le parcours est le parcours. */}
        {mode === 'TOUR_DU_MONDE' ? (
          <p className="rounded-xl border border-chene/50 bg-feutre/60 px-4 py-3 text-sm text-craie/75">
            On part du <strong className="text-craie">20</strong> et on descend jusqu’au 1, puis on
            finit sur la <strong className="text-craie">bulle</strong>. Simple, double ou triple :
            peu importe, il suffit de toucher le secteur. Quand quelqu’un boucle, le tour de table
            se termine — c’est le nombre de fléchettes qui départage.
          </p>
        ) : (
          <>
            <Choix legende="Score de départ" valeurs={SCORES} valeur={score} onChange={setScore} />
            <Choix
              legende="Best of (legs)"
              valeurs={BEST_OF}
              valeur={bestOf}
              onChange={setBestOf}
            />

            <div className="flex flex-col gap-2">
              <Bascule
                libelle="Double out"
                aide="Finir obligatoirement sur un double"
                actif={doubleOut}
                onChange={setDoubleOut}
              />
              <Bascule
                libelle="Double in"
                aide="Ne décompter qu’après un premier double"
                actif={doubleIn}
                onChange={setDoubleIn}
              />
            </div>
          </>
        )}
      </Panneau>

      {erreur && <MessageErreur>{erreur}</MessageErreur>}

      <div className="mt-auto flex flex-col gap-2 pt-1">
        <p className="flex items-center justify-center gap-2 text-center font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie/60">
          <Check aria-hidden="true" className="size-3.5" />
          {mode === 'TOUR_DU_MONDE' ? (
            'Tour du monde · 20 → bulle'
          ) : (
            <>
              {score} · BO{bestOf} · {doubleOut ? 'double out' : 'sortie libre'}
              {doubleIn && ' · double in'}
            </>
          )}
        </p>

        <Button
          taille="lg"
          className="w-full"
          disabled={selection.length === 0 || occupe}
          onClick={() => void commencer()}
        >
          <Play aria-hidden="true" className="size-5 fill-current" />
          Commencer
        </Button>
      </div>
    </main>
  )
}
