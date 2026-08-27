import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { X01Config } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { momentDepuisVoleeX01 } from '@/ui/composants/x01/momentVolee'
import { PaveFlechettes } from '@/ui/composants/x01/PaveFlechettes'
import { Tableau } from '@/ui/composants/x01/Tableau'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useX01 } from '@/ui/hooks/useX01'
import { libelleLegsCourt, nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

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
  <>
    <Link
      to="/"
      aria-label="Retour à l’accueil"
      className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie/80 active:bg-craie/15"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Link>

    <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie/75">
      <span className="font-bold text-accent-mode-clair">Leg {legNumber + 1}</span>
      {config.setsToWin > 1 && <span>· Set {setNumber + 1}</span>}
      <span aria-hidden="true" className="text-craie/25">
        |
      </span>
      <span className="chiffres">{config.startingScore}</span>
      <span>· {libelleLegsCourt(config.legsToWin)}</span>
    </p>

    <span className="flex shrink-0 gap-1">
      {config.doubleIn && (
        <span className="grave border border-accent-mode/50 px-1.5 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-accent-mode-clair">
          DI
        </span>
      )}
      {config.doubleOut && (
        <span className="grave border border-accent-mode/50 px-1.5 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-accent-mode-clair">
          DO
        </span>
      )}
    </span>
  </>
)

export const X01Ecran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()

  const match = useX01(identifiant)
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

  const heroMilestone = match.derniereVolee?.milestones.find(
    (m) => m.type === 'MatchFinished' || m.type === 'SetWon' || m.type === 'LegWon',
  )
  const heroId =
    heroMilestone == null
      ? undefined
      : heroMilestone.type === 'MatchFinished'
        ? heroMilestone.winnerId
        : heroMilestone.playerId
  const heroNom = heroId ? nomJoueur(profils.get(heroId)?.name ?? null) : undefined
  const moment = momentDepuisVoleeX01(match.derniereVolee, heroNom)

  // « Annuler » vit DANS le pavé, sur sa dernière rangée : le bas de l'écran
  // est la seule zone qu'on atteint sans changer la prise du téléphone.
  const actions = {
    onAnnuler: () => void match.annuler(),
    peutAnnuler: match.peutAnnuler,
    annulation: match.annulation,
    desactive: match.occupe,
  }

  return (
    <DispositionPartie
      mode="X01"
      enTete={
        <EnTeteManche
          config={state.config}
          legNumber={state.legNumber}
          setNumber={state.setNumber}
        />
      }
      saisie={
        <PaveFlechettes
          multiplicateur={match.multiplicateur}
          onMultiplicateur={match.setMultiplicateur}
          onFlechette={match.ajouterFlechette}
          {...actions}
        />
      }
    >
      <Tableau
        state={state}
        resteAffiche={match.resteAffiche}
        dartsEnCours={match.dartsEnCours}
        suggestion={match.suggestion}
        profils={profils}
        moyennes={moyennes}
      />

      <MomentCelebratif moment={moment} />

      {match.erreur && <MessageErreur>{match.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
