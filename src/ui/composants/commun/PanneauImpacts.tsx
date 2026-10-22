import type { DartboardHits } from '@/core/domain/services/dartboardHits'
import { CarteImpacts } from '@/ui/composants/commun/CarteImpacts'
import { Panneau } from '@/ui/composants/commun/Panneau'

/** Cartes d'impacts côte à côte au résumé de partie. ⚠️ Toujours juxtaposées : un sélecteur détruirait la comparaison. */

export type Impacts = {
  readonly id: string
  readonly nom: string
  readonly hits: DartboardHits
}

type Props = {
  readonly joueurs: readonly Impacts[]
  /** La phrase de bas de panneau : elle change selon ce qu'on cumule. */
  readonly aide: string
}

export const PanneauImpacts = ({ joueurs, aide }: Props) => {
  const seul = joueurs.length === 1

  return (
    <Panneau titre="Où tapent les fléchettes">
      <div
        className={`grid gap-x-4 gap-y-5 ${
          seul ? 'mx-auto max-w-[15rem] grid-cols-1' : 'grid-cols-2'
        }`}
      >
        {joueurs.map((joueur) => (
          <CarteImpacts key={joueur.id} nom={joueur.nom} hits={joueur.hits} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-snug text-craie-3">{aide}</p>
    </Panneau>
  )
}
