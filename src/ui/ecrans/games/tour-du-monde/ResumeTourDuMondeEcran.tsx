import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { variablesAccent } from '@/ui/accents'
import { cheminNouvellePartie } from '@/ui/chemins'
import { ActionsFinDePartie } from '@/ui/composants/commun/ActionsFinDePartie'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { EcranErreur, Spinner } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { TableauHonneur } from '@/ui/composants/commun/TableauHonneur'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import { nomJoueur, phraseVictoire, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const ResumeTourDuMondeEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const services = useServices()
  const profils = useProfils()

  const partie = useQuery({
    queryKey: ['tourDuMondeResume', identifiant],
    queryFn: () => services.playTourDuMonde.getState(identifiant),
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
  const total = state.config.targets.length
  const vainqueur = state.players.find((joueur) => joueur.playerId === state.winnerId)
  // Un match nul est possible : à égalité de fléchettes, on ne départage pas.
  const exaequo = state.finished && state.winnerId === null

  /** Ceux qui ont bouclé d'abord, du plus rapide au plus lent, puis les autres. */
  const classement = [...state.players].sort((a, b) => {
    if (a.finishedInDarts !== null && b.finishedInDarts !== null) {
      return a.finishedInDarts - b.finishedInDarts
    }
    if (a.finishedInDarts !== null) return -1
    if (b.finishedInDarts !== null) return 1
    return b.targetIndex - a.targetIndex
  })

  return (
    <main
      style={variablesAccent('TOUR_DU_MONDE')}
      className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
    >
      <TableauHonneur
        nomPartie={nomPartie}
        mode="TOUR_DU_MONDE"
        surtitre="Tour du monde terminé"
        vainqueur={
          vainqueur
            ? {
                nom: nomJoueur(profils.get(vainqueur.playerId)?.name ?? null),
                couleur: profils.get(vainqueur.playerId)?.color ?? null,
                detail: `Bouclé en ${pluriel(vainqueur.finishedInDarts ?? 0, 'fléchette', 'fléchettes')}`,
              }
            : undefined
        }
        exAequo={
          exaequo
            ? {
                titre: 'Ex æquo',
                detail:
                  'Même parcours, même nombre de fléchettes : personne ne mérite de passer devant.',
              }
            : undefined
        }
        phrase={vainqueur ? phraseVictoire(identifiant) : undefined}
      />

      <Panneau titre="Classement" contenuClassName="p-3">
        <ol className="flex flex-col gap-2">
          {classement.map((joueur, rang) => {
            const profil = profils.get(joueur.playerId)
            const nom = nomJoueur(profil?.name ?? null)

            return (
              <li key={joueur.playerId} className="flex items-center gap-3">
                <span
                  className={`chiffres w-4 shrink-0 text-sm font-bold ${
                    rang === 0 ? 'text-accent-mode' : 'text-craie-3'
                  }`}
                >
                  {rang + 1}
                </span>
                <Avatar nom={nom} couleur={profil?.color ?? null} taille="sm" />
                <span className="min-w-0 flex-1 truncate text-craie">{nom}</span>

                {joueur.finishedInDarts !== null ? (
                  <span className="chiffres text-sm font-bold text-vert-cible">
                    {joueur.finishedInDarts} fl.
                  </span>
                ) : (
                  <span className="chiffres text-sm text-craie-3">
                    {joueur.targetIndex}
                    <span className="text-craie-3">/{total}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </Panneau>

      <ActionsFinDePartie
        matchId={identifiant}
        versReglages={cheminNouvellePartie('TOUR_DU_MONDE')}
      />
    </main>
  )
}
