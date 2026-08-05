import { useQuery } from '@tanstack/react-query'
import { House, RotateCcw, Target } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Button } from '@/ui/composants/commun/Button'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Un mot sur la performance — encourageant sans être malhonnête. */
const appreciation = (pourcentage: number): string => {
  if (pourcentage >= 60) return 'Redoutable. Les doubles te craignent.'
  if (pourcentage >= 40) return 'Solide. C’est déjà un niveau de club.'
  if (pourcentage >= 20) return 'Ça rentre. Continue, c’est exactement comme ça qu’on progresse.'
  return 'Les doubles se gagnent à l’usure. Refais une série.'
}

export const ResumeEntrainementEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()

  const session = useQuery({
    queryKey: ['entrainementResume', identifiant],
    queryFn: () => services.playCheckoutPractice.getState(identifiant),
  })

  if (session.isPending) return <Spinner label="Calcul du résultat…" />
  if (session.error || !session.data) {
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

  const state = session.data
  const pourcentage = Math.round(state.successPercent)
  // La clé se construit ici : deux manches peuvent avoir tiré le même reste.
  const reussies = state.rounds
    .filter((round) => round.outcome === 'CHECKOUT')
    .map((round, rang) => ({ ...round, cle: `${rang}-${round.target}` }))

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <TableauHonneur
        mode="CHECKOUT_PRACTICE"
        surtitre="Séance terminée"
        phrase={appreciation(pourcentage)}
      >
        <output
          aria-label="Taux de réussite"
          className="chiffres trace-craie mt-3 block text-[4.5rem] font-bold leading-none text-craie-vive"
        >
          {pourcentage}
          <span className="text-3xl font-normal text-craie/60"> %</span>
        </output>

        <p className="mt-1 font-score text-sm uppercase tracking-[0.2em] text-vert-cible">
          {state.roundsWon} sortie{state.roundsWon > 1 ? 's' : ''} sur {state.roundsPlayed}
        </p>
      </TableauHonneur>

      <Panneau titre="Les sorties réussies" contenuClassName="p-3">
        {reussies.length === 0 ? (
          <p className="py-2 text-center text-sm text-craie/60">
            Aucune cette fois — le prochain double est le bon.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {reussies.map((round) => (
              <li
                key={round.cle}
                className="flex items-center gap-1.5 rounded-xl border border-vert-cible/50 bg-vert-cible/12 px-3 py-1.5"
              >
                <Target aria-hidden="true" className="size-3.5 shrink-0 text-vert-cible" />
                <span className="chiffres text-base font-bold text-craie-vive">{round.target}</span>
                <span className="chiffres text-xs text-craie/60">en {round.darts.length} fl.</span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <div className="mt-auto grid gap-2 pt-1">
        <Button taille="lg" onClick={() => navigate('/entrainement')}>
          <RotateCcw aria-hidden="true" className="size-5" />
          Nouvelle série
        </Button>
        <Button variante="secondaire" onClick={() => navigate('/')}>
          <House aria-hidden="true" className="size-4" />
          Accueil
        </Button>
      </div>
    </main>
  )
}
