import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import type { X01PlayerStats } from '@/core/domain/games/x01/stats'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { cheminNouvellePartie } from '@/ui/chemins'
import { ActionsFinDePartie } from '@/ui/composants/commun/ActionsFinDePartie'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { PanneauImpacts } from '@/ui/composants/commun/PanneauImpacts'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { type LigneStat, TableauJoueurs } from '@/ui/composants/commun/TableauJoueurs'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import {
  LIBELLE_MANCHES,
  LIBELLE_MEILLEURE_MANCHE,
  moyenne,
  nomJoueur,
  phraseVictoire,
  pourcent,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Les chiffres qui se commentent au comptoir. ⚠️ « Fléchettes » ferme la liste : c'est le dénominateur de la moyenne. */
const LIGNES: readonly LigneStat<X01PlayerStats>[] = [
  {
    libelle: 'Moyenne',
    valeur: (j) => moyenne(j.average3),
    meilleur: (j) => j.average3,
    accent: true,
  },
  {
    libelle: 'First 9',
    valeur: (j) => moyenne(j.first9Average),
    meilleur: (j) => j.first9Average,
    accent: true,
  },
  {
    libelle: 'Meilleure volée',
    valeur: (j) => j.highestVisit,
    meilleur: (j) => j.highestVisit,
  },
  { libelle: '180', valeur: (j) => j.count180, meilleur: (j) => j.count180 },
  { libelle: '140+', valeur: (j) => j.count140plus, meilleur: (j) => j.count140plus },
  { libelle: '100+', valeur: (j) => j.count100plus, meilleur: (j) => j.count100plus },
  {
    libelle: '% doubles',
    valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts),
    meilleur: (j) => j.checkoutPercent,
  },
  {
    // Le seul classement du projet où **petit** vaut mieux que grand.
    libelle: LIBELLE_MEILLEURE_MANCHE,
    valeur: (j) => j.bestLegDarts ?? '—',
    meilleur: (j) => (j.bestLegDarts === null ? Number.NEGATIVE_INFINITY : -j.bestLegDarts),
  },
  {
    libelle: 'Plus haut checkout',
    valeur: (j) => j.highestCheckout || '—',
    meilleur: (j) => j.highestCheckout,
  },
  {
    // ⚠️ Aucun meneur : lancer plus de fléchettes n'est pas un exploit.
    libelle: 'Fléchettes',
    valeur: (j) => j.dartsThrown,
    meilleur: () => 0,
  },
]

export const ResumeX01Ecran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const services = useServices()
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
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <TableauHonneur
        nomPartie={nomPartie}
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
            <p className="font-score text-etiquette uppercase tracking-[0.28em] text-craie-3">
              {LIBELLE_MANCHES}
            </p>
            <p className="chiffres flex items-center gap-3 text-2xl font-bold text-craie-2">
              {joueurs.map((joueur, index) => (
                <span key={joueur.playerId} className="flex items-center gap-3">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-craie-decor">
                      –
                    </span>
                  )}
                  <span
                    title={nomJoueur(profils.get(joueur.playerId)?.name ?? null)}
                    className={
                      joueur.playerId === stats.data.winnerId ? 'text-laiton' : 'text-craie-3'
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

      <Panneau titre="La feuille" contenuClassName="overflow-x-auto p-3">
        <TableauJoueurs
          libelle="Statistiques de la partie"
          colonnes={joueurs.map((joueur) => {
            const profil = profils.get(joueur.playerId)
            return {
              id: joueur.playerId,
              nom: nomJoueur(profil?.name ?? null),
              couleur: profil?.color ?? null,
              vainqueur: joueur.playerId === stats.data.winnerId,
            }
          })}
          joueurs={joueurs}
          lignes={LIGNES}
        />
      </Panneau>

      <PanneauImpacts
        joueurs={joueurs.map((joueur) => ({
          id: joueur.playerId,
          nom: nomJoueur(profils.get(joueur.playerId)?.name ?? null),
          hits: joueur.hits,
        }))}
        aide="Les fléchettes de cette partie seulement. L'échelle est propre à chaque joueur : on compare des formes, pas des volumes."
      />

      <ActionsFinDePartie matchId={identifiant} versReglages={cheminNouvellePartie('X01')} />
    </main>
  )
}
