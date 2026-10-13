import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Cartouche } from '@/ui/composants/checkout-practice/Cartouche'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { PaveFlechettes } from '@/ui/composants/x01/PaveFlechettes'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useCheckoutPractice } from '@/ui/hooks/useCheckoutPractice'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import { useServices } from '@/ui/providers/ServicesProvider'

export const EntrainementEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const navigate = useNavigate()
  const services = useServices()

  const session = useCheckoutPractice(identifiant)
  const { state, termine } = session

  useWakeLock(state !== null && !termine)

  useEffect(() => {
    if (termine) navigate(`/partie/${identifiant}/resume`, { replace: true })
  }, [termine, identifiant, navigate])

  if (session.chargement) return <Spinner label="Préparation de l’entraînement…" />

  if (session.erreurChargement || !state) {
    return (
      <EcranErreur
        message="Cette séance est introuvable."
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

  // La route conseillée se recalcule à chaque fléchette : c'est l'intérêt même
  // de l'exercice, apprendre le chemin autant que le toucher.
  const suggestion =
    session.resteAffiche > 1
      ? services.getCheckoutSuggestion.execute({
          remaining: session.resteAffiche,
          dartsLeft: Math.max(1, 3 - session.dartsEnCours.length),
          config: { doubleOut: true },
        })
      : null

  return (
    <DispositionPartie
      nomPartie={nomPartie}
      mode="CHECKOUT_PRACTICE"
      enTete={
        <>
          <Link
            to="/"
            aria-label="Retour à l’accueil"
            className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie-2 active:bg-craie/15"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>

          <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie-2">
            <span className="font-bold text-accent-mode-clair">Entraînement</span>
            <span aria-hidden="true" className="text-craie-decor">
              |
            </span>
            <span>Checkout</span>
          </p>
        </>
      }
      saisie={
        /* Le même pavé qu'au X01 : on s'entraîne à sortir, donc on saisit
           fléchette par fléchette — c'est le seul mode de saisie du projet. */
        <PaveFlechettes
          multiplicateur={session.multiplicateur}
          onMultiplicateur={session.setMultiplicateur}
          onFlechette={session.ajouterFlechette}
          onAnnuler={() => void session.annuler()}
          peutAnnuler={session.peutAnnuler}
          desactive={session.occupe}
        />
      }
    >
      <Cartouche
        cible={session.cible}
        resteAffiche={session.resteAffiche}
        suggestion={suggestion}
        dartsEnCours={session.dartsEnCours}
        manche={Math.min(state.roundsPlayed + 1, state.config.rounds)}
        total={state.config.rounds}
        reussies={state.roundsWon}
      />

      {session.erreur && <MessageErreur>{session.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
