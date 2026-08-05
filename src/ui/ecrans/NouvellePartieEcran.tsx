import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, ChevronsDown, Globe2, Grid3x3, Play, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import {
  CRICKET_VARIANTS,
  CricketConfig,
  type CricketVariant,
} from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { ACCENTS_MODE } from '@/ui/accents'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { CLE_JOUEURS, useJoueurs } from '@/ui/hooks/useJoueurs'
import { LIBELLE_VARIANTE_CRICKET } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

const SCORES = [301, 501, 701] as const
const BEST_OF = [1, 3, 5, 7] as const
const MAX_JOUEURS = 4

/**
 * Sélecteur segmenté : un rail d'ardoise, un curseur de laiton **plat** qui
 * glisse. Le relief poli est réservé au CTA — ici il saturait l'écran.
 */
const Choix = <T extends string | number>({
  legende,
  valeurs,
  valeur,
  onChange,
  libelle = (option) => String(option),
}: {
  readonly legende: string
  readonly valeurs: readonly T[]
  readonly valeur: T
  readonly onChange: (valeur: T) => void
  /** Par défaut la valeur elle-même : les scores et les best-of se lisent tels quels. */
  readonly libelle?: (valeur: T) => string
}) => {
  const rang = Math.max(valeurs.indexOf(valeur), 0)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65">
        {legende}
      </legend>
      <div
        className="relative grid rounded-xl border border-chene/45 bg-feutre/70 p-1"
        style={{ gridTemplateColumns: `repeat(${valeurs.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          style={{
            width: `calc((100% - 0.5rem) / ${valeurs.length})`,
            transform: `translateX(${rang * 100}%)`,
          }}
          className="laiton-plat absolute inset-y-1 left-1 rounded-lg transition-transform duration-200 ease-out"
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
            {libelle(option)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const MODES: readonly {
  readonly id: Exclude<GameModeId, 'CHECKOUT_PRACTICE'>
  readonly libelle: string
  readonly accroche: string
  readonly Icone: typeof Globe2
}[] = [
  { id: 'X01', libelle: 'X01', accroche: 'Décompte', Icone: ChevronsDown },
  { id: 'TOUR_DU_MONDE', libelle: 'Tour du monde', accroche: '20 → bulle', Icone: Globe2 },
  { id: 'CRICKET', libelle: 'Cricket', accroche: 'Fermer', Icone: Grid3x3 },
]

/**
 * Trois cartes distinctes — on sent le jeu choisi, pas seulement un segment
 * qui glisse. L'accent du mode colore la carte active.
 */
const ChoixMode = ({
  valeur,
  onChange,
}: {
  readonly valeur: GameModeId
  readonly onChange: (mode: GameModeId) => void
}) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65">
      Jeu
    </legend>
    <div className="grid grid-cols-3 gap-2">
      {MODES.map((option) => {
        const choisi = option.id === valeur
        const accent = ACCENTS_MODE[option.id]
        const Icone = option.Icone
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={choisi}
            onClick={() => onChange(option.id)}
            style={
              choisi
                ? {
                    borderColor: accent.clair,
                    backgroundColor: `color-mix(in srgb, ${accent.fond} 18%, transparent)`,
                    boxShadow: `0 0 20px -10px ${accent.fond}`,
                  }
                : undefined
            }
            className={[
              'flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2',
              'transition-colors duration-150',
              choisi ? 'text-craie-vive' : 'border-chene/45 bg-feutre/60 text-craie/70',
            ].join(' ')}
          >
            <Icone
              aria-hidden="true"
              className="size-5"
              style={choisi ? { color: accent.clair } : undefined}
            />
            <span
              className="font-score text-[0.65rem] font-bold uppercase leading-tight tracking-wide"
              style={choisi ? { color: accent.clair } : undefined}
            >
              {option.libelle}
            </span>
            <span
              className={`text-[0.6rem] leading-none ${choisi ? 'text-craie/75' : 'text-craie/45'}`}
            >
              {option.accroche}
            </span>
          </button>
        )
      })}
    </div>
  </fieldset>
)

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
          actif ? 'laiton-plat left-[1.6rem]' : 'left-0.5 bg-craie/45'
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
  const [variante, setVariante] = useState<CricketVariant>('STANDARD')
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
    } catch (cause) {
      setErreur(
        cause instanceof Error && cause.message === 'Player name already taken'
          ? 'Ce pseudo est déjà pris.'
          : 'Ce pseudo n’est pas valide.',
      )
    }
  }

  /** Un mode, un use case : l'aiguillage de la couture `GameMode`, côté départ. */
  const demarrer = () => {
    switch (mode) {
      case 'TOUR_DU_MONDE':
        return services.playTourDuMonde.start({
          playerIds: selection,
          config: TourDuMondeConfig.create(),
        })
      case 'CRICKET':
        return services.playCricket.start({
          playerIds: selection,
          config: CricketConfig.create({ variant: variante }),
        })
      default:
        return services.startMatch.execute({
          playerIds: selection,
          config: X01Config.create({
            startingScore: score,
            legsToWin: X01Config.legsForBestOf(bestOf),
            doubleOut,
            doubleIn,
          }),
        })
    }
  }

  const commencer = async () => {
    setErreur(null)
    setOccupe(true)
    try {
      const matchId = await demarrer()
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
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-chene/45 bg-ardoise text-craie/80 active:bg-chene/30"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-score text-2xl font-bold uppercase tracking-wide text-craie-vive">
            Nouvelle partie
          </h1>
          <p className="font-score text-[0.6rem] uppercase tracking-[0.25em] text-craie/60">
            Joueurs · règles · lancer
          </p>
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
        ) : mode === 'CRICKET' ? (
          <>
            <Choix
              legende="Comptage"
              valeurs={CRICKET_VARIANTS}
              valeur={variante}
              onChange={setVariante}
              libelle={(option) => LIBELLE_VARIANTE_CRICKET[option]}
            />

            <p className="rounded-xl border border-chene/50 bg-feutre/60 px-4 py-3 text-sm text-craie/75">
              Sept cibles à fermer en trois touches : <strong className="text-craie">20</strong> à{' '}
              <strong className="text-craie">15</strong> et la{' '}
              <strong className="text-craie">bulle</strong>. Une cible fermée chez soi mais pas chez
              les autres rapporte des points ;{' '}
              {variante === 'CUT_THROAT'
                ? 'en cut-throat ils sont infligés aux adversaires, et le plus PETIT score gagne.'
                : 'gagne celui qui ferme tout sans être derrière au score.'}
            </p>
          </>
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
          ) : mode === 'CRICKET' ? (
            `Cricket ${LIBELLE_VARIANTE_CRICKET[variante]} · 20 → 15 · bulle`
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
