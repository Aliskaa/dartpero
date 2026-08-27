import type { DartboardHits } from '@/core/domain/services/dartboardHits'
import { CarteImpacts } from '@/ui/composants/commun/CarteImpacts'
import { Panneau } from '@/ui/composants/commun/Panneau'

/**
 * Les cartes d'impacts, côte à côte — la seule chose de l'app qui parle du bras
 * plutôt que du score.
 *
 * Partagée par l'écran Statistiques (cumul de carrière) et le résumé de partie
 * (une soirée). C'est le même geste qu'on regarde ; seule la fenêtre change, et
 * elle est déjà annoncée par l'écran qui pose le panneau.
 *
 * ⚠️ Toujours **plusieurs cartes côte à côte** quand il y a plusieurs joueurs :
 * c'est un écran de comparaison, et une carte isolée derrière un sélecteur de
 * joueur détruirait ce que la juxtaposition donne gratuitement — « lui il vise,
 * moi j'arrose » se voit en une seconde, se démontre difficilement.
 */

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
      <p className="mt-4 text-xs leading-snug text-craie/60">{aide}</p>
    </Panneau>
  )
}
