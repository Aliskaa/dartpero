import { useQuery } from '@tanstack/react-query'
import { Play, WifiOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { Skeleton } from '@/ui/composants/commun/Etats'
import { LogoHero } from '@/ui/composants/commun/Logo'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { nomJoueur } from '@/ui/labels'
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
            <span className="chiffres text-[0.65rem] uppercase tracking-widest text-craie/60">
              {encours.data.config.startingScore} · BO{encours.data.config.legsToWin * 2 - 1}
            </span>
          }
          className="animate-monter"
        >
          <ul className="flex flex-col gap-2">
            {encours.data.players.map((joueur) => {
              const nom = nomJoueur(joueur.name)
              return (
                <li key={joueur.playerId} className="flex items-center gap-3">
                  <Avatar
                    nom={nom}
                    couleur={profils.get(joueur.playerId)?.color ?? null}
                    taille="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-craie">{nom}</span>
                  <span className="chiffres text-2xl font-bold leading-none text-craie-vive">
                    {joueur.remaining}
                  </span>
                </li>
              )
            })}
          </ul>

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
