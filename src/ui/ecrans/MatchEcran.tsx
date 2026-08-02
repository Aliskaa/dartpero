import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { PaveFlechettes } from '@/ui/composants/match/PaveFlechettes'
import { PaveRapide } from '@/ui/composants/match/PaveRapide'
import { Tableau } from '@/ui/composants/match/Tableau'
import { usePreference, useWakeLock } from '@/ui/hooks/useAppareil'
import { useNomsJoueurs } from '@/ui/hooks/useJoueurs'
import { useMatch } from '@/ui/hooks/useMatch'
import { nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const CLE_MODE_RAPIDE = 'saisie-rapide'

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
      <div className="flex flex-col gap-4 p-5">
        <MessageErreur>Cette partie est introuvable.</MessageErreur>
        <Link to="/" className="text-center text-laiton underline">
          Retour à l’accueil
        </Link>
      </div>
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
    <div className="feutre-tapis flex min-h-dvh flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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

      <div className="mt-auto flex flex-col gap-3">
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
            ↶ Annuler
          </Button>
          <Button variante="secondaire" aria-pressed={rapide} onClick={() => setRapide(!rapide)}>
            {rapide ? 'Fléchette' : '⚡ Rapide'}
          </Button>
        </div>
      </div>
    </div>
  )
}
