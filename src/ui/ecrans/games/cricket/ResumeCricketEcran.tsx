import { useQuery } from '@tanstack/react-query'
import { Crown, House, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { MARKS_TO_CLOSE } from '@/core/domain/games/cricket/config'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { Cible } from '@/ui/composants/commun/Cible'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { LIBELLE_VARIANTE_CRICKET, nomJoueur, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const ResumeCricketEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()

  const partie = useQuery({
    queryKey: ['cricketResume', identifiant],
    queryFn: () => services.playCricket.getState(identifiant),
  })

  if (partie.isPending) return <Spinner label="Chargement du résultat…" />
  if (partie.error || !partie.data) {
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

  const state = partie.data
  const cutThroat = state.config.variant === 'CUT_THROAT'
  const total = state.config.targets.length
  const vainqueur = state.players.find((joueur) => joueur.playerId === state.winnerId)

  const fermees = (marks: readonly number[]) =>
    marks.filter((marques) => marques >= MARKS_TO_CLOSE).length

  /**
   * Le classement suit la règle de la variante : au Cricket standard le plus
   * gros score mène, en cut-throat c'est le plus petit. Les cibles fermées
   * départagent — c'est ce qui reste à faire pour conclure.
   */
  const classement = [...state.players].sort((a, b) => {
    if (a.score !== b.score) return cutThroat ? a.score - b.score : b.score - a.score
    return fermees(b.marks) - fermees(a.marks)
  })

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <section className="cadre-bois relative animate-monter overflow-hidden rounded-3xl px-6 py-7 text-center">
        <Cible
          className="pointer-events-none absolute -right-16 -top-16 size-56 opacity-[0.09]"
          avecNumeros
        />

        <div className="relative flex flex-col items-center">
          <p className="font-score text-[0.65rem] uppercase tracking-[0.35em] text-craie/60">
            Cricket {LIBELLE_VARIANTE_CRICKET[state.config.variant]} terminé
          </p>

          {vainqueur ? (
            <>
              <span className="relative mt-4 inline-flex">
                <Avatar
                  nom={nomJoueur(profils.get(vainqueur.playerId)?.name ?? null)}
                  couleur={profils.get(vainqueur.playerId)?.color ?? null}
                  taille="xl"
                  className="shadow-[0_0_40px_-8px_var(--color-laiton)]"
                />
                <Crown
                  aria-hidden="true"
                  className="absolute -top-4 left-1/2 size-8 -translate-x-1/2 -rotate-12 fill-laiton text-laiton drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
                />
              </span>

              <h1 className="mt-4 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_rgba(0,0,0,0.6)]">
                {nomJoueur(profils.get(vainqueur.playerId)?.name ?? null)}
              </h1>
              <p className="mt-1 font-score text-sm font-bold uppercase tracking-[0.3em] text-vert-cible">
                Vainqueur
              </p>
              <p className="chiffres mt-2 text-sm text-craie/70">
                Tout fermé · {pluriel(vainqueur.score, 'point')}
              </p>
            </>
          ) : (
            <h1 className="mt-4 font-display text-3xl text-laiton">Partie en cours</h1>
          )}
        </div>
      </section>

      <Panneau titre="Classement" contenuClassName="p-3">
        <ol className="flex flex-col gap-2">
          {classement.map((joueur, rang) => {
            const profil = profils.get(joueur.playerId)
            const nom = nomJoueur(profil?.name ?? null)

            return (
              <li key={joueur.playerId} className="flex items-center gap-3">
                <span
                  className={`chiffres w-4 shrink-0 text-sm font-bold ${
                    rang === 0 ? 'text-laiton' : 'text-craie/40'
                  }`}
                >
                  {rang + 1}
                </span>
                <Avatar nom={nom} couleur={profil?.color ?? null} taille="sm" />
                <span className="min-w-0 flex-1 truncate text-craie">{nom}</span>

                <span className="chiffres text-sm text-craie/60">
                  {fermees(joueur.marks)}
                  <span className="text-craie/40">/{total}</span>
                </span>
                <span className="chiffres w-12 text-right text-base font-bold text-craie-vive">
                  {joueur.score}
                </span>
              </li>
            )
          })}
        </ol>
      </Panneau>

      <div className="mt-auto grid gap-2 pt-1">
        <Button taille="lg" onClick={() => navigate('/nouvelle-partie')}>
          <RotateCcw aria-hidden="true" className="size-5" />
          Nouvelle partie
        </Button>
        <Button variante="secondaire" onClick={() => navigate('/')}>
          <House aria-hidden="true" className="size-4" />
          Accueil
        </Button>
      </div>
    </main>
  )
}
