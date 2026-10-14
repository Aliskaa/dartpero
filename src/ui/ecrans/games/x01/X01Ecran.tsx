import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { X01Config } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { BadgeBandeau, BandeauMatch } from '@/ui/composants/commun/BandeauMatch'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
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
 * Le bandeau du X01 : DI / DO en complément du sous-titre, « Manche N » et
 * « Set M » à droite (le set seulement quand la partie en compte).
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
  <BandeauMatch
    pictogramme="x01"
    titre={TITRE_BANDEAU_X01}
    sousTitre={sousTitreBandeauX01(config.startingScore, config.legsToWin)}
    complement={
      (config.doubleIn || config.doubleOut) && (
        <>
          {config.doubleIn && <BadgeBandeau>DI</BadgeBandeau>}
          {config.doubleOut && <BadgeBandeau>DO</BadgeBandeau>}
        </>
      )
    }
    droite={
      <>
        <span className="whitespace-nowrap">{libelleMancheEnCours(legNumber + 1)}</span>
        {config.setsToWin > 1 && (
          <span className="whitespace-nowrap">{libelleSetEnCours(setNumber + 1)}</span>
        )}
      </>
    }
  />
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
