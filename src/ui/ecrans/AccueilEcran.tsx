import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/ui/composants/commun/Button'
import { Spinner } from '@/ui/composants/commun/Etats'
import { nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const AccueilEcran = () => {
  const services = useServices()
  const navigate = useNavigate()

  const encours = useQuery({
    queryKey: ['matchEnCours'],
    queryFn: () => services.getOngoingMatch.execute(),
  })

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-8 px-5 py-10">
      <header className="text-center">
        <p className="font-score text-xs uppercase tracking-[0.35em] text-craie/60">
          Compteur de fléchettes
        </p>
        <h1 className="mt-2 font-display text-5xl text-laiton drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
          Dartpéro
        </h1>
      </header>

      {encours.isPending ? (
        <Spinner />
      ) : encours.data ? (
        <section aria-label="Partie en cours" className="ardoise-craie rounded-2xl p-4">
          <p className="font-score text-xs uppercase tracking-widest text-craie/70">
            Partie en cours
          </p>
          <ul className="mt-3 flex flex-col gap-1">
            {encours.data.players.map((joueur) => (
              <li key={joueur.playerId} className="flex items-baseline justify-between">
                <span className="truncate text-craie">{nomJoueur(joueur.name)}</span>
                <span className="chiffres text-2xl font-bold text-craie-vive">
                  {joueur.remaining}
                </span>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" onClick={() => navigate(`/partie/${encours.data?.id}`)}>
            Reprendre
          </Button>
        </section>
      ) : null}

      <Link
        to="/nouvelle-partie"
        className="laiton-poli inline-flex min-h-14 items-center justify-center rounded-full px-6 font-score text-lg font-bold uppercase tracking-widest"
      >
        Nouvelle partie
      </Link>

      <p className="mt-auto text-center text-xs text-craie/60">
        100 % local, hors ligne, sans compte.
      </p>
    </main>
  )
}
