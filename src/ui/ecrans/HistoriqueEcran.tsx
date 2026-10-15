import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { matchStatus } from '@/core/application/use-cases/summarize'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { quandCarte } from '@/ui/cartesPartie'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { CartePartie } from '@/ui/composants/commun/CartePartie'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { FeuillePartie } from '@/ui/composants/commun/FeuillePartie'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { LIBELLE_MODE, LIBELLE_MODE_COURT, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * `'TOUS'` n'est pas un mode : c'est l'absence de filtre.
 *
 * Il vit dans l'UI et ne descend jamais dans le port — `GetMatchHistory` prend
 * un `GameModeId` ou rien, et « rien » est déjà la façon de tout demander.
 */
const TOUS = 'TOUS' as const

type FiltreMode = typeof TOUS | GameModeId

const FILTRES: readonly FiltreMode[] = [TOUS, ...GAME_MODE_IDS]

const libelleFiltre = (filtre: FiltreMode): string =>
  filtre === TOUS ? 'Tous' : LIBELLE_MODE_COURT[filtre]

/** La suppression, hors de la cible principale de la carte : sa propre cible, en deux temps. */
const BoutonSupprimer = ({ onSupprimer }: { readonly onSupprimer: () => Promise<void> }) => {
  const [confirme, setConfirme] = useState(false)

  return (
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
        // 48 px de large, toujours : l'état « à confirmer » ne se distingue que par le fond et
        // l'icône, il ne comprime jamais la ligne.
        'flex min-h-12 w-12 min-w-12 shrink-0 items-center justify-center border-l-2',
        'transition-colors',
        confirme
          ? 'border-rouge-cible bg-rouge-cible/30 text-craie-vive'
          : 'border-rouge-cible/50 bg-rouge-cible/10 text-craie-2',
      ].join(' ')}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}

export const HistoriqueEcran = () => {
  const services = useServices()
  const queryClient = useQueryClient()
  const profils = useProfils()
  const [erreur, setErreur] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<FiltreMode>(TOUS)

  const historique = useQuery({
    // Le filtre fait partie de la clé : chaque mode garde son cache.
    queryKey: [...CLE_HISTORIQUE, filtre],
    queryFn: () => services.getMatchHistory.execute(50, filtre === TOUS ? undefined : filtre),
  })

  // ⚠️ La partie en cours est **globale**, jamais filtrée par mode : c'est ce
  // qui rend « Abandonnée » identique ici et à l'Accueil, même sous un filtre.
  const encours = useQuery({
    queryKey: CLE_MATCH_EN_COURS,
    queryFn: () => services.getOngoingMatch.execute(),
  })
  const enCoursId = encours.data?.id ?? null

  const supprimer = async (id: MatchId) => {
    setErreur(null)
    try {
      await services.deleteMatch.execute(id)
      // Supprimer la partie en cours change aussi celle de l'Accueil et le
      // statut des autres : les deux requêtes repartent.
      await queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE })
      await queryClient.invalidateQueries({ queryKey: CLE_MATCH_EN_COURS })
    } catch {
      setErreur('Cette partie n’a pas pu être supprimée.')
    }
  }

  const parties = historique.data ?? []
  // L'heure par l'horloge injectée, jamais `Date.now()`.
  const maintenant = services.clock.now()

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre="Parties"
        sousTitre={
          filtre === TOUS
            ? pluriel(parties.length, 'partie enregistrée', 'parties enregistrées')
            : `${pluriel(parties.length, 'partie', 'parties')} · ${LIBELLE_MODE[filtre]}`
        }
      />

      <div className="flex flex-col gap-3 px-4">
        <ChoixSegmente
          legende="Mode"
          taille="sm"
          valeurs={FILTRES}
          valeur={filtre}
          onChange={setFiltre}
          libelle={libelleFiltre}
        />

        {erreur && <MessageErreur>{erreur}</MessageErreur>}

        {historique.isPending || encours.isPending ? (
          <SpinnerLigne label="Chargement de l’historique…" />
        ) : parties.length === 0 ? (
          // ⚠️ Deux vides à ne pas confondre, comme sur l'écran Statistiques :
          // un filtre sans résultat ne veut pas dire une base vide.
          filtre === TOUS ? (
            <EmptyState
              titre="Rien au tableau"
              description="Les parties jouées s’empilent ici, terminées ou non. On peut en reprendre une à tout moment."
            />
          ) : (
            <EmptyState
              titre={`Aucune partie de ${LIBELLE_MODE[filtre]}`}
              description="Les autres modes sont toujours là — repassez sur « Tous » pour les revoir."
            />
          )
        ) : (
          <FeuillePartie>
            {parties.map((partie) => (
              <CartePartie
                key={partie.id}
                partie={partie}
                statut={matchStatus(partie, enCoursId)}
                profils={profils}
                quand={quandCarte(partie.createdAt, maintenant, 'parties')}
                marquerEnCours
                actions={<BoutonSupprimer onSupprimer={() => supprimer(partie.id)} />}
              />
            ))}
          </FeuillePartie>
        )}
      </div>
    </main>
  )
}
