import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Crown, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { dateHeure, nomJoueur, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const CLE_HISTORIQUE = ['historique'] as const

/** Le classement d'une partie : vainqueur en tête, puis le reste dans l'ordre du tableau. */
const classer = (partie: MatchSummary) =>
  [...partie.players].sort((a, b) => {
    if (a.playerId === partie.winnerId) return -1
    if (b.playerId === partie.winnerId) return 1
    return b.legsWonInSet - a.legsWonInSet
  })

const CartePartie = ({
  partie,
  onOuvrir,
  onSupprimer,
}: {
  readonly partie: MatchSummary
  readonly onOuvrir: () => void
  readonly onSupprimer: () => Promise<void>
}) => {
  const profils = useProfils()
  const [confirme, setConfirme] = useState(false)

  return (
    <li className="cadre-bois overflow-hidden rounded-2xl">
      <header className="bois-veine flex items-center justify-between gap-2 px-3 py-2">
        <span className="grave font-score text-[0.65rem] uppercase tracking-widest text-craie/80">
          {dateHeure(partie.createdAt)}
        </span>
        <span
          className={[
            'grave rounded-full border px-2 py-0.5 font-score text-[0.6rem] uppercase tracking-wider',
            partie.finished
              ? 'border-vert-cible/60 bg-vert-cible/20 text-vert-cible'
              : 'border-laiton/60 bg-laiton/15 text-laiton-clair',
          ].join(' ')}
        >
          {partie.finished ? 'Terminée' : 'En cours'}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-3">
        <p className="font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie/60">
          X01 · {partie.config.startingScore} · BO{partie.config.legsToWin * 2 - 1}
          {partie.config.doubleOut && ' · double out'}
          {partie.config.doubleIn && ' · double in'}
        </p>

        <ul className="flex flex-col gap-1.5">
          {classer(partie).map((joueur) => {
            const nom = nomJoueur(joueur.name)
            const gagnant = joueur.playerId === partie.winnerId
            return (
              <li key={joueur.playerId} className="flex items-center gap-2">
                <Avatar
                  nom={nom}
                  couleur={profils.get(joueur.playerId)?.color ?? null}
                  taille="xs"
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    gagnant ? 'font-semibold text-craie-vive' : 'text-craie/75'
                  }`}
                >
                  {nom}
                </span>
                {gagnant && <Crown aria-hidden="true" className="size-3.5 shrink-0 text-laiton" />}
                <span className="chiffres text-xs text-craie/60">
                  {pluriel(joueur.legsWonInSet, 'leg')}
                </span>
                <span className="chiffres w-10 text-right text-base font-bold text-craie-vive">
                  {joueur.remaining}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={onOuvrir}
            className="touche flex min-h-12 items-center justify-center gap-2 rounded-xl font-score text-sm font-bold uppercase tracking-widest text-craie"
          >
            {partie.finished ? 'Voir le résumé' : 'Reprendre'}
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>

          <button
            type="button"
            aria-label={confirme ? 'Confirmer la suppression de la partie' : 'Supprimer la partie'}
            onClick={async () => {
              if (!confirme) {
                setConfirme(true)
                return
              }
              await onSupprimer()
            }}
            className={[
              'flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-4',
              'font-score text-sm font-bold uppercase tracking-widest transition-colors',
              confirme
                ? 'border-rouge-cible bg-rouge-cible/30 text-craie-vive'
                : 'border-rouge-cible/50 bg-rouge-cible/10 text-craie/80',
            ].join(' ')}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {confirme && 'Sûr ?'}
          </button>
        </div>
      </div>
    </li>
  )
}

export const HistoriqueEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const [erreur, setErreur] = useState<string | null>(null)

  const historique = useQuery({
    queryKey: CLE_HISTORIQUE,
    queryFn: () => services.getMatchHistory.execute(50),
  })

  const supprimer = async (id: MatchId) => {
    setErreur(null)
    try {
      await services.deleteMatch.execute(id)
      await historique.refetch()
    } catch {
      setErreur('Cette partie n’a pas pu être supprimée.')
    }
  }

  const parties = historique.data ?? []

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre="Parties"
        sousTitre={pluriel(parties.length, 'partie enregistrée', 'parties enregistrées')}
      />

      <div className="flex flex-col gap-3 px-4">
        {erreur && <MessageErreur>{erreur}</MessageErreur>}

        {historique.isPending ? (
          <SpinnerLigne label="Chargement de l’historique…" />
        ) : parties.length === 0 ? (
          <EmptyState
            titre="Rien au tableau"
            description="Les parties jouées s’empilent ici, terminées ou non. On peut en reprendre une à tout moment."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {parties.map((partie) => (
              <CartePartie
                key={partie.id}
                partie={partie}
                onOuvrir={() =>
                  navigate(partie.finished ? `/partie/${partie.id}/resume` : `/partie/${partie.id}`)
                }
                onSupprimer={() => supprimer(partie.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
