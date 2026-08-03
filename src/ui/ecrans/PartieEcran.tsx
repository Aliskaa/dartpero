import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { useServices } from '@/ui/providers/ServicesProvider'
import { ResumeTourDuMondeEcran } from './ResumeTourDuMondeEcran'
import { ResumeX01Ecran } from './ResumeX01Ecran'
import { TourDuMondeEcran } from './TourDuMondeEcran'
import { X01Ecran } from './X01Ecran'

/**
 * L'aiguillage de la couture `GameMode`, côté écran.
 *
 * Une même URL (`/partie/:id`) mène à des écrans différents selon le mode de la
 * partie — l'utilisateur n'a pas à savoir dans quel mode il reprend, et un lien
 * d'historique reste valable quel que soit le jeu.
 *
 * Chaque mode a son **propre** écran plutôt qu'un écran unique bourré de
 * conditions : on ne compte pas un 501 comme on remonte un plateau, et les
 * deux zones de saisie n'ont rien en commun.
 */
const useMode = (matchId: MatchId) => {
  const services = useServices()
  return useQuery({
    queryKey: ['matchMode', matchId],
    queryFn: () => services.getMatchMode.execute(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })
}

const Aiguillage = ({
  matchId,
  x01,
  tourDuMonde,
}: {
  readonly matchId: MatchId
  readonly x01: React.ReactNode
  readonly tourDuMonde: React.ReactNode
}) => {
  const mode = useMode(matchId)

  if (mode.isPending) return <Spinner label="Chargement de la partie…" />
  if (mode.error || !mode.data) {
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

  return <>{mode.data === 'TOUR_DU_MONDE' ? tourDuMonde : x01}</>
}

export const PartieEcran = () => {
  const { matchId } = useParams()
  return (
    <Aiguillage
      matchId={(matchId ?? '') as MatchId}
      x01={<X01Ecran />}
      tourDuMonde={<TourDuMondeEcran />}
    />
  )
}

export const ResumePartieEcran = () => {
  const { matchId } = useParams()
  return (
    <Aiguillage
      matchId={(matchId ?? '') as MatchId}
      x01={<ResumeX01Ecran />}
      tourDuMonde={<ResumeTourDuMondeEcran />}
    />
  )
}
