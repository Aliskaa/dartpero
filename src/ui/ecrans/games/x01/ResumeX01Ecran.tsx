import { useQuery } from '@tanstack/react-query'
import { Crown, House, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import type { X01PlayerStats } from '@/core/domain/games/x01/stats'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { variablesAccent } from '@/ui/accents'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { StatTile } from '@/ui/composants/commun/StatTile'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { moyenne, nomJoueur, phraseVictoire } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Les huit chiffres qui se commentent au comptoir, dans cet ordre. */
const tuiles = (joueur: X01PlayerStats) => [
  { libelle: 'Moyenne', valeur: moyenne(joueur.average3), accent: true },
  { libelle: 'First 9', valeur: moyenne(joueur.first9Average), accent: true },
  { libelle: '180', valeur: joueur.count180 },
  { libelle: '140+', valeur: joueur.count140plus },
  { libelle: '100+', valeur: joueur.count100plus },
  { libelle: '% doubles', valeur: Math.round(joueur.checkoutPercent), suffixe: '%' },
  { libelle: 'Meilleur leg', valeur: joueur.bestLegDarts ?? '—' },
  { libelle: 'Plus haut checkout', valeur: joueur.highestCheckout || '—' },
]

export const ResumeX01Ecran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()

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
  const nomVainqueur = vainqueur
    ? nomJoueur(profils.get(vainqueur.playerId)?.name ?? null)
    : undefined

  return (
    <main
      style={variablesAccent('X01')}
      className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
    >
      <TableauHonneur
        mode="X01"
        surtitre="Partie terminée"
        vainqueur={
          vainqueur && nomVainqueur
            ? {
                nom: nomVainqueur,
                couleur: profils.get(vainqueur.playerId)?.color ?? null,
              }
            : undefined
        }
        phrase={stats.data.winnerId ? phraseVictoire(identifiant) : undefined}
      >
        {joueurs.length > 1 && (
          <div className="mt-4 flex flex-col items-center gap-1">
            <p className="font-score text-[0.6rem] uppercase tracking-[0.28em] text-craie/55">
              Legs
            </p>
            <p className="chiffres flex items-center gap-3 text-2xl font-bold text-craie/80">
              {joueurs.map((joueur, index) => (
                <span key={joueur.playerId} className="flex items-center gap-3">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-craie/25">
                      –
                    </span>
                  )}
                  <span
                    title={nomJoueur(profils.get(joueur.playerId)?.name ?? null)}
                    className={
                      joueur.playerId === stats.data.winnerId ? 'text-accent-mode' : 'text-craie/50'
                    }
                  >
                    {joueur.legsWon}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )}
      </TableauHonneur>

      <div className="flex flex-col gap-3">
        {joueurs.map((joueur) => {
          const profil = profils.get(joueur.playerId)
          const nom = nomJoueur(profil?.name ?? null)
          return (
            <Panneau
              key={joueur.playerId}
              aria-label={`Statistiques de ${nom}`}
              /* Un `<h2>` porterait le même nom que le titre du vainqueur : ici
                 c'est la section qui est nommée, pas un intitulé de plus. */
              enTete={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar nom={nom} couleur={profil?.color ?? null} taille="sm" />
                  <span className="grave truncate font-score text-sm uppercase tracking-widest text-craie">
                    {nom}
                  </span>
                  {joueur.playerId === stats.data.winnerId && (
                    <Crown aria-hidden="true" className="size-4 shrink-0 text-accent-mode" />
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
