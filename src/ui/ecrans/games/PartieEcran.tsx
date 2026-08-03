import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { useServices } from '@/ui/providers/ServicesProvider'
import { EntrainementEcran } from './checkout-practice/EntrainementEcran'
import { ResumeEntrainementEcran } from './checkout-practice/ResumeEntrainementEcran'
import { CricketEcran } from './cricket/CricketEcran'
import { ResumeCricketEcran } from './cricket/ResumeCricketEcran'
import { ResumeTourDuMondeEcran } from './tour-du-monde/ResumeTourDuMondeEcran'
import { TourDuMondeEcran } from './tour-du-monde/TourDuMondeEcran'
import { ResumeX01Ecran } from './x01/ResumeX01Ecran'
import { X01Ecran } from './x01/X01Ecran'

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
  cricket,
  entrainement,
}: {
  readonly matchId: MatchId
  readonly x01: React.ReactNode
  readonly tourDuMonde: React.ReactNode
  readonly cricket: React.ReactNode
  readonly entrainement: React.ReactNode
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

  switch (mode.data) {
    case 'TOUR_DU_MONDE':
      return <>{tourDuMonde}</>
    case 'CRICKET':
      return <>{cricket}</>
    case 'CHECKOUT_PRACTICE':
      return <>{entrainement}</>
    default:
      return <>{x01}</>
  }
}

export const PartieEcran = () => {
  const { matchId } = useParams()
  return (
    <Aiguillage
      matchId={(matchId ?? '') as MatchId}
      x01={<X01Ecran />}
      tourDuMonde={<TourDuMondeEcran />}
      cricket={<CricketEcran />}
      entrainement={<EntrainementEcran />}
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
      cricket={<ResumeCricketEcran />}
      entrainement={<ResumeEntrainementEcran />}
    />
  )
}
