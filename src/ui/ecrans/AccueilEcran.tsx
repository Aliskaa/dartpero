import { useQuery } from '@tanstack/react-query'
import { Play, WifiOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/ui/composants/commun/Button'
import { Skeleton } from '@/ui/composants/commun/Etats'
import { LogoHero } from '@/ui/composants/commun/Logo'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { ApercuPartie, libelleRegles } from '@/ui/composants/match/ApercuPartie'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useServices } from '@/ui/providers/ServicesProvider'

export const AccueilEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()

  const encours = useQuery({
    queryKey: ['matchEnCours'],
    queryFn: () => services.getOngoingMatch.execute(),
  })

  return (
    // Le tapis et la barre du bas viennent du layout : l'écran ne pose que son
    // propre rythme vertical.
    <main className="flex flex-1 flex-col gap-7 px-5 pb-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <LogoHero />

      {encours.isPending ? (
        <Skeleton className="h-36" />
      ) : encours.data ? (
        <Panneau
          aria-label="Partie en cours"
          titre="Partie en cours"
          action={
            <span className="text-[0.65rem] uppercase tracking-widest text-craie/60">
              {libelleRegles(encours.data)}
            </span>
          }
          className="animate-monter"
        >
          <ApercuPartie partie={encours.data} profils={profils} />

          <Button className="mt-4 w-full" onClick={() => navigate(`/partie/${encours.data?.id}`)}>
            <Play aria-hidden="true" className="size-4 fill-current" />
            Reprendre
          </Button>
        </Panneau>
      ) : null}

      <Link
        to="/nouvelle-partie"
        className={[
          'laiton-poli mt-auto inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl px-6',
          'font-score text-xl font-bold uppercase tracking-[0.15em]',
        ].join(' ')}
      >
        Nouvelle partie
      </Link>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-craie/60">
        <WifiOff aria-hidden="true" className="size-3.5" />
        100 % local, hors ligne, sans compte.
      </p>
    </main>
  )
}
