import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { CRICKET_VARIANTS } from '@/core/domain/games/cricket/config'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import {
  LEGS,
  type ReglagesNouvellePartie,
  SCORES,
  SETS,
  SORTIES,
} from '@/ui/hooks/useNouvellePartie'
import {
  AIDE_DOUBLE_IN,
  AIDE_DOUBLE_OUT,
  aideManches,
  aideSets,
  LEGENDE_COMPTAGE,
  LEGENDE_MANCHES_A_GAGNER,
  LEGENDE_NOMBRE_SORTIES,
  LEGENDE_SCORE_DEPART,
  LEGENDE_SETS_A_GAGNER,
  LIBELLE_DOUBLE_IN,
  LIBELLE_DOUBLE_OUT,
  LIBELLE_VARIANTE_CRICKET,
  PARAGRAPHE_TOUR_DU_MONDE,
  paragrapheCricket,
  paragrapheEntrainement,
  type Segment,
} from '@/ui/labels'
import { Bascule } from './Bascule'

/** Un paragraphe de règles écrit dans `labels.ts`, ses mots forts compris. */
const Paragraphe = ({ segments }: { readonly segments: readonly Segment[] }) => (
  <p className="border border-chene/50 bg-feutre/60 px-4 py-3 text-sm text-craie/75">
    {segments.map((segment, rang) =>
      typeof segment === 'string' ? (
        segment
      ) : (
        // Les segments sont figés, leur rang est une clé stable.
        // biome-ignore lint/suspicious/noArrayIndexKey: liste constante, jamais réordonnée.
        <strong key={rang} className="text-craie">
          {segment.fort}
        </strong>
      ),
    )}
  </p>
)

type Props = {
  readonly mode: GameModeId
  readonly reglages: ReglagesNouvellePartie
  /** Le nombre de joueurs retenus : l'aide des manches en dépend. */
  readonly joueurs: number
}

/** Les réglages du jeu choisi. Un `switch` exhaustif : un mode oublié ne compile pas. */
export const ReglagesJeu = ({ mode, reglages, joueurs }: Props) => {
  switch (mode) {
    case 'X01':
      return (
        <>
          <ChoixSegmente
            legende={LEGENDE_SCORE_DEPART}
            valeurs={SCORES}
            valeur={reglages.score}
            onChange={reglages.setScore}
          />
          <ChoixSegmente
            legende={LEGENDE_MANCHES_A_GAGNER}
            valeurs={LEGS}
            valeur={reglages.legs}
            onChange={reglages.setLegs}
            aide={aideManches(reglages.legs, reglages.sets, joueurs)}
          />
          <ChoixSegmente
            legende={LEGENDE_SETS_A_GAGNER}
            valeurs={SETS}
            valeur={reglages.sets}
            onChange={reglages.setSets}
            aide={aideSets(reglages.sets, reglages.legs)}
          />
          <div className="flex flex-col gap-2">
            <Bascule
              libelle={LIBELLE_DOUBLE_OUT}
              aide={AIDE_DOUBLE_OUT}
              actif={reglages.doubleOut}
              onChange={reglages.setDoubleOut}
            />
            <Bascule
              libelle={LIBELLE_DOUBLE_IN}
              aide={AIDE_DOUBLE_IN}
              actif={reglages.doubleIn}
              onChange={reglages.setDoubleIn}
            />
          </div>
        </>
      )
    case 'CRICKET':
      return (
        <>
          <ChoixSegmente
            legende={LEGENDE_COMPTAGE}
            valeurs={CRICKET_VARIANTS}
            valeur={reglages.variante}
            onChange={reglages.setVariante}
            libelle={(option) => LIBELLE_VARIANTE_CRICKET[option]}
          />
          <Paragraphe segments={paragrapheCricket(reglages.variante === 'CUT_THROAT')} />
        </>
      )
    case 'TOUR_DU_MONDE':
      // Rien à régler : le parcours est le parcours.
      return <Paragraphe segments={PARAGRAPHE_TOUR_DU_MONDE} />
    case 'CHECKOUT_PRACTICE':
      return (
        <>
          <Paragraphe
            segments={paragrapheEntrainement(
              DEFAUT_ENTRAINEMENT.minTarget,
              DEFAUT_ENTRAINEMENT.maxTarget,
            )}
          />
          <ChoixSegmente
            legende={LEGENDE_NOMBRE_SORTIES}
            valeurs={SORTIES}
            valeur={reglages.sorties}
            onChange={reglages.setSorties}
          />
        </>
      )
    default: {
      const jamais: never = mode
      return jamais
    }
  }
}
