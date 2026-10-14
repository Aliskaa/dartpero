import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { cheminNouvellePartie } from '@/ui/chemins'
import { ActionsFinDePartie } from '@/ui/composants/commun/ActionsFinDePartie'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
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
  const nomPartie = useNomDePartie(identifiant)
  const services = useServices()

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
        nomPartie={nomPartie}
        mode="CHECKOUT_PRACTICE"
        surtitre="Séance terminée"
        phrase={appreciation(pourcentage)}
      >
        <output
          aria-label="Taux de réussite"
          className="chiffres mt-3 block text-score-solo font-bold leading-none text-craie-vive"
        >
          {pourcentage}
          <span className="text-3xl font-normal text-craie-3"> %</span>
        </output>

        <p className="mt-1 font-score text-sm uppercase tracking-[0.2em] text-vert-cible">
          {state.roundsWon} sortie{state.roundsWon > 1 ? 's' : ''} sur {state.roundsPlayed}
        </p>
      </TableauHonneur>

      <Panneau titre="Les sorties réussies" contenuClassName="p-3">
        {reussies.length === 0 ? (
          <p className="py-2 text-center text-sm text-craie-3">
            Aucune cette fois — le prochain double est le bon.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {reussies.map((round) => (
              <li
                key={round.cle}
                className="flex items-center gap-1.5 border border-vert-cible/50 bg-vert-cible/12 px-3 py-1.5"
              >
                <Pictogramme nom="sortie" taille={20} className="shrink-0 text-vert-cible" />
                <span className="chiffres text-base font-bold text-craie-vive">{round.target}</span>
                <span className="chiffres text-xs text-craie-3">en {round.darts.length} fl.</span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <ActionsFinDePartie
        matchId={identifiant}
        versReglages={cheminNouvellePartie('CHECKOUT_PRACTICE')}
        libelleReglages="Changer l’exercice"
      />
    </main>
  )
}
