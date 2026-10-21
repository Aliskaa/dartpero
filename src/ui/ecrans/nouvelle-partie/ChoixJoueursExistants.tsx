import { useQuery } from '@tanstack/react-query'
import { Check, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { Player } from '@/core/domain/entities/Player'
import type { GameModeId } from '@/core/domain/games'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { cheminNouvellePartie } from '@/ui/chemins'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { EmptyState, SpinnerLigne } from '@/ui/composants/commun/Etats'
import {
  CHARGEMENT_PROFILS,
  DESCRIPTION_AUCUN_PROFIL,
  LIBELLE_NOUVEAU_JOUEUR,
  LIBELLE_TERMINE,
  libelleManchesJouees,
  RETOUR_ETAPE_PRECEDENTE,
  SOUS_TITRE_JOUEURS_EXISTANTS,
  TITRE_AUCUN_PROFIL,
  TITRE_JOUEURS_EXISTANTS,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { type CreerJoueur, DialogueNouveauJoueur } from './DialogueNouveauJoueur'
import { EnTeteEtape, useRetour } from './EnTeteEtape'

type Props = {
  readonly mode: GameModeId
  readonly profils: readonly Player[]
  readonly chargement: boolean
  readonly selection: readonly PlayerId[]
  readonly max: number
  readonly onBasculer: (id: PlayerId) => void
  readonly onCreer: CreerJoueur
}

/**
 * « Sélectionner un joueur existant » — un écran plein, une liste cochable.
 *
 * Sous chaque nom, ses manches X01 jouées ; **rien** pour qui n'a jamais joué
 * au X01 (pas « 0 manche »). Les stats arrivent du même cache que l'écran
 * Statistiques, et la liste ne les attend jamais : un nom sans sa ligne vaut
 * mieux qu'un écran qui patiente.
 */
export const ChoixJoueursExistants = ({
  mode,
  profils,
  chargement,
  selection,
  max,
  onBasculer,
  onCreer,
}: Props) => {
  const services = useServices()
  const precedent = cheminNouvellePartie(mode)
  const retour = useRetour(precedent)
  const [dialogue, setDialogue] = useState(false)

  const stats = useQuery({
    queryKey: ['statistiquesJoueurs', 'ALL_TIME'],
    queryFn: () => services.getPlayerStats.execute('ALL_TIME'),
  })
  const manches = new Map((stats.data ?? []).map((joueur) => [joueur.playerId, joueur.legsPlayed]))
  const plein = selection.length >= max

  return (
    <>
      <EnTeteEtape
        titre={TITRE_JOUEURS_EXISTANTS}
        sousTitre={SOUS_TITRE_JOUEURS_EXISTANTS}
        cheminPrecedent={precedent}
        libelleRetour={RETOUR_ETAPE_PRECEDENTE}
        action={
          <Button variante="secondaire" onClick={retour}>
            {LIBELLE_TERMINE}
          </Button>
        }
      />

      {chargement ? (
        <SpinnerLigne label={CHARGEMENT_PROFILS} />
      ) : profils.length === 0 ? (
        <EmptyState
          titre={TITRE_AUCUN_PROFIL}
          description={DESCRIPTION_AUCUN_PROFIL}
          action={
            <Button variante="secondaire" onClick={() => setDialogue(true)}>
              <UserPlus aria-hidden="true" className="size-4" />
              {LIBELLE_NOUVEAU_JOUEUR}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {profils.map((profil) => {
            const choisi = selection.includes(profil.id)
            const jouees = manches.get(profil.id) ?? 0
            return (
              <li key={profil.id}>
                <button
                  type="button"
                  aria-pressed={choisi}
                  disabled={!choisi && plein}
                  onClick={() => onBasculer(profil.id)}
                  className={[
                    'flex min-h-14 w-full items-center gap-3 border px-3 py-2 text-left',
                    'transition-colors duration-150 disabled:opacity-40',
                    choisi ? 'border-laiton/60 bg-laiton/10' : 'border-chene/55 bg-feutre/60',
                  ].join(' ')}
                >
                  <Avatar nom={profil.name} couleur={profil.color} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={`truncate font-score text-base uppercase tracking-wide ${
                        choisi ? 'text-craie-vive' : 'text-craie-2'
                      }`}
                    >
                      {profil.name}
                    </span>
                    {jouees > 0 && (
                      <span className="text-xs text-craie-3">{libelleManchesJouees(jouees)}</span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-7 shrink-0 items-center justify-center border ${
                      choisi
                        ? 'border-laiton/60 bg-laiton/20 text-laiton-clair'
                        : 'border-craie/25 text-transparent'
                    }`}
                  >
                    <Check aria-hidden="true" className="size-4" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <DialogueNouveauJoueur
        ouvert={dialogue}
        onFermer={() => setDialogue(false)}
        onCreer={onCreer}
      />
    </>
  )
}
