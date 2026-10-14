import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { X01Config } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { momentDepuisVoleeX01 } from '@/ui/composants/x01/momentVolee'
import { PaveFlechettes } from '@/ui/composants/x01/PaveFlechettes'
import { Tableau } from '@/ui/composants/x01/Tableau'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import { useX01 } from '@/ui/hooks/useX01'
import {
  libelleMancheEnCours,
  libelleSetEnCours,
  nomJoueur,
  sousTitreBandeauX01,
  TITRE_BANDEAU_X01,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * Le bandeau de chêne en trois zones : le retour, le jeu (pictogramme, titre,
 * règles) et où l'on en est (« Manche N », « Set M »).
 *
 * Portrait : le bloc central s'empile (titre, sous-titre, puis DI / DO sous le
 * sous-titre). **Paysage** : il tient en UNE rangée (pictogramme, titre,
 * sous-titre, DI, DO), « Manche N » et « Set M » côte à côte à droite — la
 * hauteur est ce qui manque, le pavé est déjà au plancher de 48 px.
 */
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
      className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie-2 active:bg-craie/15"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Link>

    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Pictogramme nom="x01" taille={24} className="shrink-0 text-accent-mode-clair" />

      <div className="flex min-w-0 flex-col paysage:flex-row paysage:items-center paysage:gap-x-3">
        <p className="grave font-score text-lg font-bold uppercase leading-none tracking-[0.12em] text-accent-mode-clair">
          {TITRE_BANDEAU_X01}
        </p>

        <p className="grave chiffres truncate text-etiquette font-semibold uppercase leading-4 tracking-[0.08em] text-craie-2">
          {sousTitreBandeauX01(config.startingScore, config.legsToWin)}
        </p>

        {(config.doubleIn || config.doubleOut) && (
          <span className="mt-0.5 flex gap-1 paysage:mt-0">
            {config.doubleIn && (
              <span className="grave border border-accent-mode/50 px-1.5 font-score text-etiquette uppercase leading-4 tracking-wider text-accent-mode-clair">
                DI
              </span>
            )}
            {config.doubleOut && (
              <span className="grave border border-accent-mode/50 px-1.5 font-score text-etiquette uppercase leading-4 tracking-wider text-accent-mode-clair">
                DO
              </span>
            )}
          </span>
        )}
      </div>
    </div>

    {/* Où l'on en est : en craie, comme la planche. Le laiton reste au repère
        du joueur qui lance et au rail du pavé. */}
    <div className="grave flex shrink-0 flex-col items-end font-score text-etiquette font-semibold uppercase leading-4 tracking-[0.14em] text-craie-2 paysage:flex-row paysage:gap-x-3">
      <span className="whitespace-nowrap">{libelleMancheEnCours(legNumber + 1)}</span>
      {config.setsToWin > 1 && (
        <span className="whitespace-nowrap">{libelleSetEnCours(setNumber + 1)}</span>
      )}
    </div>
  </>
)

export const X01Ecran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
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
  }

  return (
    <DispositionPartie
      nomPartie={nomPartie}
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
      {/* Le moment est superposé au bas de la feuille (le ruban de sortie), hors
          du flux : il ne décale rien et ne touche jamais le pavé. */}
      <div className="relative">
        <Tableau
          state={state}
          resteAffiche={match.resteAffiche}
          dartsEnCours={match.dartsEnCours}
          suggestion={match.suggestion}
          profils={profils}
          moyennes={moyennes}
        />

        <MomentCelebratif moment={moment} />
      </div>

      {match.erreur && <MessageErreur>{match.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
