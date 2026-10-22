import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { KillerRules } from '@/core/domain/games/killer/rules'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { cheminNouvellePartie } from '@/ui/chemins'
import { ActionsFinDePartie } from '@/ui/composants/commun/ActionsFinDePartie'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import {
  LIBELLE_NUMERO,
  nomJoueur,
  phraseVictoire,
  RETOUR_ACCUEIL,
  sousLigneDernierEnVie,
  sousLigneElimination,
  surtitreResumeKiller,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Le résumé d'un Killer : classement par ordre d'élimination (`KillerRules.ranking`), « Éliminé par X » déduit du journal. */
export const ResumeKillerEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const services = useServices()
  const profils = useProfils()

  const partie = useQuery({
    queryKey: ['killerResume', identifiant],
    queryFn: () => services.playKiller.getState(identifiant),
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
            {RETOUR_ACCUEIL}
          </Link>
        }
      />
    )
  }

  const state = partie.data
  const vainqueur = state.players.find((joueur) => joueur.playerId === state.winnerId)
  const classement = [...KillerRules.ranking(state)].sort((a, b) => a.rank - b.rank)

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <TableauHonneur
        nomPartie={nomPartie}
        surtitre={surtitreResumeKiller(state.config.startingLives)}
        vainqueur={
          vainqueur
            ? {
                nom: nomJoueur(profils.get(vainqueur.playerId)?.name ?? null),
                couleur: profils.get(vainqueur.playerId)?.color ?? null,
              }
            : undefined
        }
        phrase={vainqueur ? phraseVictoire(identifiant) : undefined}
      />

      <Panneau titre="Classement" contenuClassName="p-3">
        <ol className="flex flex-col">
          {classement.map(({ playerId, rank }) => {
            const joueur = state.players.find((candidat) => candidat.playerId === playerId)
            if (!joueur) return null
            const profil = profils.get(playerId)
            const nom = nomJoueur(profil?.name ?? null)
            const elimination = state.eliminations.find((e) => e.playerId === playerId)
            const sousLigne = elimination
              ? sousLigneElimination(
                  profil?.gender,
                  elimination.by === playerId
                    ? null
                    : nomJoueur(profils.get(elimination.by)?.name ?? null),
                )
              : sousLigneDernierEnVie(joueur.lives)

            return (
              <li
                key={playerId}
                className="grid min-h-16 grid-cols-[2.125rem_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-craie/25 py-2 first:border-t-0"
              >
                <span
                  className={`chiffres text-center text-3xl font-bold leading-none ${
                    rank === 1 ? 'text-laiton-clair' : 'text-craie-2'
                  }`}
                >
                  {rank}
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar nom={nom} couleur={profil?.color ?? null} taille="md" />
                  <span className="min-w-0">
                    <b className="block truncate font-score text-lg uppercase leading-tight text-craie-vive">
                      {nom}
                    </b>
                    <small className="block text-sm text-craie-2">{sousLigne}</small>
                  </span>
                </span>
                <span className="text-center leading-none">
                  <b className="chiffres block text-2xl text-craie">{joueur.number}</b>
                  <small className="font-score text-etiquette uppercase tracking-widest text-craie-3">
                    {LIBELLE_NUMERO}
                  </small>
                </span>
              </li>
            )
          })}
        </ol>
      </Panneau>

      <ActionsFinDePartie matchId={identifiant} versReglages={cheminNouvellePartie('KILLER')} />
    </main>
  )
}
