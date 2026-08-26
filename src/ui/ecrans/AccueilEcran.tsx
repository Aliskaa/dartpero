import { useQuery } from '@tanstack/react-query'
import { Play, Target, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { Player } from '@/core/domain/entities/Player'
import { ApercuPartie, libelleRegles } from '@/ui/composants/commun/ApercuPartie'
import { Button } from '@/ui/composants/commun/Button'
import { Skeleton } from '@/ui/composants/commun/Etats'
import { LogoHero } from '@/ui/composants/commun/Logo'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { couleurJoueur } from '@/ui/couleurs'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Signal vivant entre l'enseigne et le CTA — plus de trou au milieu. */
const SignalAccueil = ({ joueurs }: { readonly joueurs: readonly Player[] }) => {
  if (joueurs.length === 0) {
    return (
      <Panneau aria-label="Premiers pas" className="animate-monter">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center border border-chene/40 bg-feutre/80 text-laiton">
            <Users aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-score text-sm font-bold uppercase tracking-wide text-craie">
              Qui joue ce soir ?
            </p>
            <p className="mt-1 text-sm text-craie/70">
              Ajoutez vos potes — un pseudo, une couleur, c’est parti.
            </p>
            <Link
              to="/joueurs"
              className="mt-3 inline-flex min-h-11 items-center font-score text-sm font-bold uppercase tracking-wider text-laiton"
            >
              Créer un joueur →
            </Link>
          </div>
        </div>
      </Panneau>
    )
  }

  const apercu = joueurs.slice(0, 5)

  // La feuille du soir : une liste numérotée plutôt que des pastilles
  // superposées. On y lit qui est là, dans l'ordre où on les a inscrits.
  return (
    <section aria-label="Joueurs inscrits" className="feuille animate-monter flex flex-col">
      <div className="bandeau-feuille flex items-baseline justify-between px-3 py-1">
        <span className="entete-colonne text-feutre/70">Ce soir à l’oche</span>
        <span className="chiffres text-xs font-bold text-feutre/70">{joueurs.length}</span>
      </div>

      <ul className="flex flex-col">
        {apercu.map((joueur, rang) => (
          <li
            key={joueur.id}
            className="ligne-tableau flex items-center gap-3 px-3 py-2 last:border-b-0"
          >
            <span className="chiffres w-4 shrink-0 text-xs font-bold text-craie/45">
              {rang + 1}
            </span>
            <span
              aria-hidden="true"
              style={{ backgroundColor: couleurJoueur(joueur.color).fond }}
              className="size-3 shrink-0"
            />
            <span className="min-w-0 flex-1 truncate font-score text-sm uppercase tracking-[0.08em] text-craie">
              {joueur.name}
            </span>
          </li>
        ))}
        {joueurs.length > apercu.length && (
          <li className="px-3 py-2 font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie/50">
            + {joueurs.length - apercu.length} autre{joueurs.length - apercu.length > 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </section>
  )
}

export const AccueilEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()
  const joueurs = [...profils.values()]

  const encours = useQuery({
    queryKey: ['matchEnCours'],
    queryFn: () => services.getOngoingMatch.execute(),
  })

  return (
    // Le tapis et la barre du bas viennent du layout : l'écran ne pose que son
    // propre rythme vertical.
    <main className="flex flex-1 flex-col gap-6 px-5 pb-4 pt-[max(2rem,env(safe-area-inset-top))]">
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
      ) : (
        <SignalAccueil joueurs={joueurs} />
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Link
          to="/nouvelle-partie"
          className={[
            'laiton-poli inline-flex min-h-16 items-center justify-center gap-3 px-6',
            'font-score text-xl font-bold uppercase tracking-[0.15em]',
          ].join(' ')}
        >
          Nouvelle partie
        </Link>

        {/* L'entraînement se joue seul : il n'a pas sa place au même rang qu'une
            partie entre potes, mais il doit rester à un doigt. */}
        <Link
          to="/entrainement"
          className={[
            'inline-flex min-h-14 items-center justify-center gap-2 border-2 border-craie/55 px-6',
            'font-score text-base font-bold uppercase tracking-[0.15em] text-craie',
            'active:bg-craie active:text-feutre',
          ].join(' ')}
        >
          <Target aria-hidden="true" className="size-4" />
          S’entraîner au checkout
        </Link>
      </div>
    </main>
  )
}
