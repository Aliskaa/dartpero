import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { EcranErreur, Spinner, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { useServices } from '@/ui/providers/ServicesProvider'

// Un chunk par mode : un mode ajouté doit gagner sa paire de `lazy()` ici, sinon il retombe dans le chunk commun.
const X01Ecran = lazy(() => import('./x01/X01Ecran').then((m) => ({ default: m.X01Ecran })))
const ResumeX01Ecran = lazy(() =>
  import('./x01/ResumeX01Ecran').then((m) => ({ default: m.ResumeX01Ecran })),
)
const TourDuMondeEcran = lazy(() =>
  import('./tour-du-monde/TourDuMondeEcran').then((m) => ({ default: m.TourDuMondeEcran })),
)
const ResumeTourDuMondeEcran = lazy(() =>
  import('./tour-du-monde/ResumeTourDuMondeEcran').then((m) => ({
    default: m.ResumeTourDuMondeEcran,
  })),
)
const CricketEcran = lazy(() =>
  import('./cricket/CricketEcran').then((m) => ({ default: m.CricketEcran })),
)
const ResumeCricketEcran = lazy(() =>
  import('./cricket/ResumeCricketEcran').then((m) => ({ default: m.ResumeCricketEcran })),
)
const KillerEcran = lazy(() =>
  import('./killer/KillerEcran').then((m) => ({ default: m.KillerEcran })),
)
const ResumeKillerEcran = lazy(() =>
  import('./killer/ResumeKillerEcran').then((m) => ({ default: m.ResumeKillerEcran })),
)
const EntrainementEcran = lazy(() =>
  import('./checkout-practice/EntrainementEcran').then((m) => ({
    default: m.EntrainementEcran,
  })),
)
const ResumeEntrainementEcran = lazy(() =>
  import('./checkout-practice/ResumeEntrainementEcran').then((m) => ({
    default: m.ResumeEntrainementEcran,
  })),
)

/** L'aiguillage de la couture `GameMode` : une même URL `/partie/:id`, un écran propre à chaque mode. */
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
  killer,
  entrainement,
}: {
  readonly matchId: MatchId
  readonly x01: React.ReactNode
  readonly tourDuMonde: React.ReactNode
  readonly cricket: React.ReactNode
  readonly killer: React.ReactNode
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

  // ⚠️ Un `case` par mode et un `default` typé `never` : un mode non listé ne doit pas ouvrir l'écran X01.
  const ecran = (() => {
    const id = mode.data
    switch (id) {
      case 'X01':
        return x01
      case 'TOUR_DU_MONDE':
        return tourDuMonde
      case 'CRICKET':
        return cricket
      case 'CHECKOUT_PRACTICE':
        return entrainement
      case 'KILLER':
        return killer
      default: {
        const jamais: never = id
        return jamais
      }
    }
  })()

  return <Suspense fallback={<SpinnerLigne />}>{ecran}</Suspense>
}

export const PartieEcran = () => {
  const { matchId } = useParams()
  return (
    <Aiguillage
      matchId={(matchId ?? '') as MatchId}
      x01={<X01Ecran />}
      tourDuMonde={<TourDuMondeEcran />}
      cricket={<CricketEcran />}
      killer={<KillerEcran />}
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
      killer={<ResumeKillerEcran />}
      entrainement={<ResumeEntrainementEcran />}
    />
  )
}
