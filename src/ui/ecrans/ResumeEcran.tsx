import { useQuery } from '@tanstack/react-query'
import { Crown, House, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import type { PlayerStats } from '@/core/domain/services/matchStats'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { Cible } from '@/ui/composants/commun/Cible'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { StatTile } from '@/ui/composants/commun/StatTile'
import { useNomsJoueurs } from '@/ui/hooks/useJoueurs'
import { moyenne, nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Les huit chiffres qui se commentent au comptoir, dans cet ordre. */
const tuiles = (joueur: PlayerStats) => [
  { libelle: 'Moyenne', valeur: moyenne(joueur.average3), accent: true },
  { libelle: 'First 9', valeur: moyenne(joueur.first9Average), accent: true },
  { libelle: '180', valeur: joueur.count180 },
  { libelle: '140+', valeur: joueur.count140plus },
  { libelle: '100+', valeur: joueur.count100plus },
  { libelle: '% doubles', valeur: Math.round(joueur.checkoutPercent), suffixe: '%' },
  { libelle: 'Meilleur leg', valeur: joueur.bestLegDarts ?? '—' },
  { libelle: 'Plus haut checkout', valeur: joueur.highestCheckout || '—' },
]

export const ResumeEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const noms = useNomsJoueurs()

  const stats = useQuery({
    queryKey: ['matchResume', identifiant],
    queryFn: () => services.getMatchStats.execute(identifiant),
  })

  if (stats.isPending) return <Spinner label="Calcul des statistiques…" />
  if (stats.error || !stats.data) {
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

  const joueurs = stats.data.players
  const vainqueur = joueurs.find((joueur) => joueur.playerId === stats.data.winnerId)

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      {/* Le tableau d'honneur : on lit le nom du vainqueur avant tout le reste. */}
      <section className="cadre-bois relative animate-monter overflow-hidden rounded-3xl px-6 py-7 text-center">
        <Cible
          className="pointer-events-none absolute -right-16 -top-16 size-56 opacity-[0.09]"
          avecNumeros
        />

        <div className="relative flex flex-col items-center">
          <p className="font-score text-[0.65rem] uppercase tracking-[0.35em] text-craie/60">
            Partie terminée
          </p>

          {vainqueur ? (
            <>
              <span className="relative mt-4 inline-flex">
                <Avatar
                  id={vainqueur.playerId}
                  nom={nomJoueur(noms.get(vainqueur.playerId) ?? null)}
                  taille="xl"
                  className="shadow-[0_0_40px_-8px_var(--color-laiton)]"
                />
                <Crown
                  aria-hidden="true"
                  className="absolute -top-4 left-1/2 size-8 -translate-x-1/2 -rotate-12 fill-laiton text-laiton drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
                />
              </span>

              <h1 className="mt-4 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_rgba(0,0,0,0.6)]">
                {nomJoueur(noms.get(vainqueur.playerId) ?? null)}
              </h1>
              <p className="mt-1 font-score text-sm font-bold uppercase tracking-[0.3em] text-vert-cible">
                Vainqueur
              </p>
            </>
          ) : (
            <h1 className="mt-4 font-display text-3xl text-laiton">Partie en cours</h1>
          )}

          {joueurs.length > 1 && (
            <p className="chiffres mt-4 flex items-center gap-3 text-2xl font-bold text-craie/80">
              {joueurs.map((joueur, index) => (
                <span key={joueur.playerId} className="flex items-center gap-3">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-craie/25">
                      –
                    </span>
                  )}
                  <span
                    className={
                      joueur.playerId === stats.data.winnerId ? 'text-laiton' : 'text-craie/50'
                    }
                  >
                    {joueur.legsWonInSet}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {joueurs.map((joueur) => {
          const nom = nomJoueur(noms.get(joueur.playerId) ?? null)
          return (
            <Panneau
              key={joueur.playerId}
              aria-label={`Statistiques de ${nom}`}
              /* Un `<h2>` porterait le même nom que le titre du vainqueur : ici
                 c'est la section qui est nommée, pas un intitulé de plus. */
              enTete={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar id={joueur.playerId} nom={nom} taille="sm" />
                  <span className="grave truncate font-score text-sm uppercase tracking-widest text-craie">
                    {nom}
                  </span>
                  {joueur.playerId === stats.data.winnerId && (
                    <Crown aria-hidden="true" className="size-4 shrink-0 text-laiton" />
                  )}
                </span>
              }
              action={
                <span className="chiffres shrink-0 text-[0.65rem] uppercase tracking-widest text-craie/60">
                  {joueur.dartsThrown} fléchettes
                </span>
              }
              contenuClassName="p-3"
            >
              <dl className="grid grid-cols-4 gap-1.5">
                {tuiles(joueur).map((tuile) => (
                  <StatTile key={tuile.libelle} {...tuile} />
                ))}
              </dl>
            </Panneau>
          )
        })}
      </div>

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
