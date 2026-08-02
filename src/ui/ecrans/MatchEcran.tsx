import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Undo2, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { X01Config } from '@/core/domain/entities/Match'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { Button } from '@/ui/composants/commun/Button'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { PaveFlechettes } from '@/ui/composants/match/PaveFlechettes'
import { PaveRapide } from '@/ui/composants/match/PaveRapide'
import { Tableau } from '@/ui/composants/match/Tableau'
import { usePreference, useWakeLock } from '@/ui/hooks/useAppareil'
import { useNomsJoueurs } from '@/ui/hooks/useJoueurs'
import { useMatch } from '@/ui/hooks/useMatch'
import { nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const CLE_MODE_RAPIDE = 'saisie-rapide'

/** Le bandeau de chêne : où on en est, et par quelles règles on joue. */
const EnTeteManche = ({
  config,
  legNumber,
  setNumber,
}: {
  readonly config: X01Config
  readonly legNumber: number
  readonly setNumber: number
}) => (
  <header className="bois-veine flex items-center gap-3 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
    <Link
      to="/"
      aria-label="Retour à l’accueil"
      className="grave -ml-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-craie/80 active:bg-black/25"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Link>

    <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie/75">
      <span className="font-bold text-laiton-clair">Leg {legNumber + 1}</span>
      {config.setsToWin > 1 && <span>· Set {setNumber + 1}</span>}
      <span aria-hidden="true" className="text-craie/25">
        |
      </span>
      <span className="chiffres">{config.startingScore}</span>
      <span>· BO{config.legsToWin * 2 - 1}</span>
    </p>

    <span className="flex shrink-0 gap-1">
      {config.doubleIn && (
        <span className="grave rounded border border-laiton/50 px-1.5 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-laiton-clair">
          DI
        </span>
      )}
      {config.doubleOut && (
        <span className="grave rounded border border-laiton/50 px-1.5 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-laiton-clair">
          DO
        </span>
      )}
    </span>
  </header>
)

export const MatchEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const noms = useNomsJoueurs()
  const [rapide, setRapide] = usePreference(CLE_MODE_RAPIDE, false)

  const match = useMatch(identifiant)
  const { state, joueurCourant, termine } = match

  // L'écran ne doit pas s'éteindre tant que la partie n'est pas finie.
  useWakeLock(state !== null && !termine)

  // Les moyennes se recalculent après chaque volée, sans recharger le match.
  const stats = useQuery({
    queryKey: ['matchStats', identifiant, state?.history.length ?? 0],
    queryFn: () => services.getMatchStats.execute(identifiant),
    enabled: state !== null,
  })

  useEffect(() => {
    if (termine) navigate(`/partie/${identifiant}/resume`, { replace: true })
  }, [termine, identifiant, navigate])

  if (match.chargement) return <Spinner label="Chargement de la partie…" />

  if (match.erreurChargement || !state || !joueurCourant) {
    return (
      <EcranErreur
        message="Cette partie est introuvable."
        action={
          <Link
            to="/"
            className="font-score text-sm uppercase tracking-widest text-laiton underline"
          >
            Retour à l’accueil
          </Link>
        }
      />
    )
  }

  const moyennes = new Map<PlayerId, number>(
    (stats.data?.players ?? []).map((joueur) => [joueur.playerId, joueur.average3]),
  )

  // Le résumé de la volée précédente reste affiché jusqu'à la fléchette suivante.
  const derniere =
    match.dartsEnCours.length === 0 && match.derniereVolee
      ? {
          nom: nomJoueur(noms.get(match.derniereVolee.visit.playerId) ?? null),
          outcome: match.derniereVolee.visit.outcome,
          scored: match.derniereVolee.visit.scored,
        }
      : null

  return (
    <div className="feutre-tapis flex min-h-dvh flex-col">
      <EnTeteManche config={state.config} legNumber={state.legNumber} setNumber={state.setNumber} />

      <div className="flex flex-1 flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Tableau
          state={state}
          resteAffiche={match.resteAffiche}
          dartsEnCours={match.dartsEnCours}
          suggestion={match.suggestion}
          derniere={derniere}
          noms={noms}
          moyennes={moyennes}
        />

        {match.erreur && <MessageErreur>{match.erreur}</MessageErreur>}

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          {rapide ? (
            <PaveRapide
              reste={joueurCourant.remaining}
              onScore={(total, dartsUsed) => void match.enregistrerScore(total, dartsUsed)}
              desactive={match.occupe}
            />
          ) : (
            <PaveFlechettes
              multiplicateur={match.multiplicateur}
              onMultiplicateur={match.setMultiplicateur}
              onFlechette={match.ajouterFlechette}
              desactive={match.occupe}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variante="secondaire"
              disabled={!match.peutAnnuler || match.occupe}
              onClick={() => void match.annuler()}
            >
              <Undo2 aria-hidden="true" className="size-4" />
              Annuler
            </Button>
            <Button
              variante={rapide ? 'primaire' : 'secondaire'}
              aria-pressed={rapide}
              onClick={() => setRapide(!rapide)}
            >
              <Zap aria-hidden="true" className="size-4" />
              Rapide
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
