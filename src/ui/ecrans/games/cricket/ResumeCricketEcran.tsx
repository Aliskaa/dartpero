import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { MARKS_TO_CLOSE } from '@/core/domain/games/cricket/config'
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
import { LIBELLE_VARIANTE_CRICKET, nomJoueur, phraseVictoire, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const ResumeCricketEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const services = useServices()
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
    <main
      style={variablesAccent('CRICKET')}
      className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
    >
      <TableauHonneur
        nomPartie={nomPartie}
        mode="CRICKET"
        surtitre={`Cricket ${LIBELLE_VARIANTE_CRICKET[state.config.variant]} terminé`}
        vainqueur={
          vainqueur
            ? {
                nom: nomJoueur(profils.get(vainqueur.playerId)?.name ?? null),
                couleur: profils.get(vainqueur.playerId)?.color ?? null,
                detail: `Tout fermé · ${pluriel(vainqueur.score, 'point')}`,
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

                <span className="chiffres text-sm text-craie-3">
                  {fermees(joueur.marks)}
                  <span className="text-craie-3">/{total}</span>
                </span>
                <span className="chiffres w-12 text-right text-base font-bold text-craie-vive">
                  {joueur.score}
                </span>
              </li>
            )
          })}
        </ol>
      </Panneau>

      <ActionsFinDePartie matchId={identifiant} versReglages={cheminNouvellePartie('CRICKET')} />
    </main>
  )
}
