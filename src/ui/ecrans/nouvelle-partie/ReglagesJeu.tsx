import { ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { CRICKET_TARGETS, CRICKET_VARIANTS } from '@/core/domain/games/cricket/config'
import { TOUR_DU_MONDE_TARGETS } from '@/core/domain/games/tour-du-monde/config'
import type { Segment as Cible } from '@/core/domain/value-objects/Dart'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { PICTOGRAMME_PAR_MODE, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import {
  LEGS,
  type ReglagesNouvellePartie,
  SCORES,
  SETS,
  SORTIES,
} from '@/ui/hooks/useNouvellePartie'
import {
  AIDE_SORTIE,
  aideManches,
  aideSorties,
  CARTES_CRICKET,
  CHOIX_ENTREE_SORTIE,
  type ChoixEntreeSortie,
  LEGENDE_CIBLES_CRICKET,
  LEGENDE_COMPTAGE,
  LEGENDE_ENTREE,
  LEGENDE_MANCHES_A_GAGNER,
  LEGENDE_NOMBRE_SORTIES,
  LEGENDE_PARCOURS,
  LEGENDE_PLAGE_RESTES,
  LEGENDE_RECAP_REGLAGES,
  LEGENDE_SCORE_DEPART,
  LEGENDE_SETS_A_GAGNER,
  LEGENDE_SORTIE,
  LIBELLE_BULLE,
  LIBELLE_CHOIX_ENTREE_SORTIE,
  LIBELLE_NON_REGLABLE,
  LIBELLE_PLUS_DE_REGLAGES,
  LIBELLE_REGLES_EN_ENTIER,
  LIBELLE_SANS_SETS,
  LIBELLE_VARIANTE_CRICKET,
  PARAGRAPHE_TOUR_DU_MONDE,
  PARAGRAPHE_X01,
  paragrapheCricket,
  paragrapheEntrainement,
  RECAP_TOUR_DU_MONDE,
  REGLE_ENTRAINEMENT,
  REGLE_TOUR_DU_MONDE,
  REGLE_X01,
  type RecapReglages,
  recapCricket,
  recapEntrainementFiche,
  recapX01,
  regleCricket,
  type Segment,
  TITRE_FICHE_REGLAGES,
} from '@/ui/labels'

/** Une phrase écrite dans `labels.ts`, ses mots forts compris. */
const Phrase = ({ segments }: { readonly segments: readonly Segment[] }) => (
  <>
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
  </>
)

/**
 * Un pli : fermé à chaque ouverture de l'écran (l'état est local, l'étape se
 * démonte en changeant de route). Le contenu n'existe que déplié.
 */
const Depliant = ({
  libelle,
  children,
}: {
  readonly libelle: string
  readonly children: ReactNode
}) => {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert(!ouvert)}
        className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-craie/10 text-left font-score text-xs uppercase tracking-[0.12em] text-laiton-clair"
      >
        {libelle}
        <ChevronRight
          aria-hidden="true"
          className={`size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 ${
            ouvert ? 'rotate-90' : ''
          }`}
        />
      </button>
      {ouvert && children}
    </div>
  )
}

/** Le pictogramme du jeu et le récapitulatif en grand, mis à jour à chaque appui. */
const TeteFiche = ({
  mode,
  recap,
}: {
  readonly mode: GameModeId
  readonly recap: RecapReglages
}) => (
  <div className="flex items-center gap-3 border-b border-craie/25 p-3">
    <span className="shrink-0 text-laiton-clair">
      <Pictogramme nom={PICTOGRAMME_PAR_MODE[mode]} taille={32} />
    </span>
    <output aria-label={LEGENDE_RECAP_REGLAGES} className="flex min-w-0 flex-1 flex-col gap-0.5">
      <b className="font-score text-xl font-bold leading-tight text-craie-vive">
        {recap.principal}
      </b>
      <span className="font-score text-etiquette uppercase tracking-[0.14em] text-craie-2">
        {recap.secondaire}
      </span>
    </output>
  </div>
)

const choixDe = (double: boolean): ChoixEntreeSortie => (double ? 'DOUBLE' : 'LIBRE')

/** Le corps de la fiche : les réglages du jeu choisi. Un `switch` exhaustif. */
const CorpsX01 = ({
  reglages,
  joueurs,
}: {
  readonly reglages: ReglagesNouvellePartie
  readonly joueurs: number
}) => (
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
    <Depliant libelle={LIBELLE_PLUS_DE_REGLAGES}>
      <ChoixSegmente
        legende={LEGENDE_SORTIE}
        valeurs={CHOIX_ENTREE_SORTIE}
        valeur={choixDe(reglages.doubleOut)}
        onChange={(choix) => reglages.setDoubleOut(choix === 'DOUBLE')}
        libelle={(choix) => LIBELLE_CHOIX_ENTREE_SORTIE[choix]}
        aide={AIDE_SORTIE[choixDe(reglages.doubleOut)]}
      />
      <ChoixSegmente
        legende={LEGENDE_ENTREE}
        valeurs={CHOIX_ENTREE_SORTIE}
        valeur={choixDe(reglages.doubleIn)}
        onChange={(choix) => reglages.setDoubleIn(choix === 'DOUBLE')}
        libelle={(choix) => LIBELLE_CHOIX_ENTREE_SORTIE[choix]}
      />
      <ChoixSegmente
        legende={LEGENDE_SETS_A_GAGNER}
        valeurs={SETS}
        valeur={reglages.sets}
        onChange={reglages.setSets}
        libelle={(sets) => (sets === 1 ? LIBELLE_SANS_SETS : String(sets))}
      />
    </Depliant>
  </>
)

/** Comptage du Cricket : deux cartes qui disent à qui vont les points et qui gagne. */
const CorpsCricket = ({ reglages }: { readonly reglages: ReglagesNouvellePartie }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3">
      {LEGENDE_COMPTAGE}
    </legend>
    <div className="grid grid-cols-2 gap-2">
      {CRICKET_VARIANTS.map((variante) => {
        const choisie = variante === reglages.variante
        return (
          <button
            key={variante}
            type="button"
            aria-pressed={choisie}
            onClick={() => reglages.setVariante(variante)}
            className={[
              'flex min-h-12 flex-col items-start gap-1.5 border-2 p-2.5 text-left',
              'transition-colors duration-150',
              choisie ? 'border-laiton bg-laiton/10' : 'border-craie/25',
            ].join(' ')}
          >
            <span className="font-score font-bold uppercase tracking-wide text-craie-vive">
              {LIBELLE_VARIANTE_CRICKET[variante]}
            </span>
            <span className="text-sm leading-snug text-craie-2">
              <Phrase segments={CARTES_CRICKET[variante].points} />
            </span>
            <span className="font-score text-etiquette uppercase leading-snug tracking-wide text-laiton-clair">
              {CARTES_CRICKET[variante].gagne}
            </span>
          </button>
        )
      })}
    </div>
  </fieldset>
)

/** La plage des restes : montrée pour information, place réservée au futur réglage. */
const PlageRestes = ({ min, max }: { readonly min: number; readonly max: number }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between gap-3 font-score text-etiquette uppercase tracking-[0.25em] text-craie-3">
      <span>{LEGENDE_PLAGE_RESTES}</span>
      <span>{LIBELLE_NON_REGLABLE}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="chiffres text-2xl text-craie-vive">{min}</span>
      <span aria-hidden="true" className="relative h-2 flex-1 bg-craie/10">
        <i className="absolute inset-0 bg-laiton" />
      </span>
      <span className="chiffres text-2xl text-craie-vive">{max}</span>
    </div>
  </div>
)

type Cibles = {
  readonly legende: string
  readonly liste: readonly Cible[]
  /** Le parcours en grille de sept colonnes (Tour du monde), ou une rangée de pastilles (Cricket). */
  readonly grille: boolean
}

/** Les cibles du jeu, dans « Les règles en entier » seulement : le récap en dit déjà le compte. */
const CasesCibles = ({ legende, liste, grille }: Cibles) => (
  <ol aria-label={legende} className={grille ? 'grid grid-cols-7 gap-1' : 'flex flex-wrap gap-1'}>
    {liste.map((cible, rang) => {
      const premiere = rang === 0
      const derniere = rang === liste.length - 1
      return (
        <li
          key={String(cible)}
          className={[
            'chiffres flex h-9 min-w-9 items-center justify-center border px-1 text-sm font-bold',
            grille && derniere
              ? 'border-laiton bg-laiton text-sur-laiton'
              : grille && premiere
                ? 'border-laiton text-laiton-clair'
                : 'border-craie/25 text-craie',
          ].join(' ')}
        >
          {cible === 'BULL' ? LIBELLE_BULLE : cible}
        </li>
      )
    })}
  </ol>
)

type Props = {
  readonly mode: GameModeId
  readonly reglages: ReglagesNouvellePartie
  /** Le nombre de joueurs retenus : l'aide des manches en dépend. */
  readonly joueurs: number
}

/**
 * La fiche de réglages du jeu choisi : pictogramme et récapitulatif en grand,
 * les réglages, une ligne de règles, « Les règles en entier » qui déplie sur
 * place. Un `switch` exhaustif : un mode oublié ne compile pas.
 */
export const ReglagesJeu = ({ mode, reglages, joueurs }: Props) => {
  const { minTarget, maxTarget } = DEFAUT_ENTRAINEMENT

  const contenu = ((): {
    readonly recap: RecapReglages
    readonly corps: ReactNode
    readonly regle: readonly Segment[]
    readonly regles: readonly Segment[]
    readonly cibles: Cibles | null
  } => {
    switch (mode) {
      case 'X01':
        return {
          recap: recapX01(reglages),
          corps: <CorpsX01 reglages={reglages} joueurs={joueurs} />,
          regle: REGLE_X01,
          regles: PARAGRAPHE_X01,
          cibles: null,
        }
      case 'CRICKET':
        return {
          recap: recapCricket(reglages.variante),
          corps: <CorpsCricket reglages={reglages} />,
          regle: regleCricket(reglages.variante === 'CUT_THROAT'),
          regles: paragrapheCricket(reglages.variante === 'CUT_THROAT'),
          cibles: { legende: LEGENDE_CIBLES_CRICKET, liste: CRICKET_TARGETS, grille: false },
        }
      case 'TOUR_DU_MONDE':
        // Rien à régler : le parcours est le parcours.
        return {
          recap: RECAP_TOUR_DU_MONDE,
          corps: null,
          regle: REGLE_TOUR_DU_MONDE,
          regles: PARAGRAPHE_TOUR_DU_MONDE,
          cibles: { legende: LEGENDE_PARCOURS, liste: TOUR_DU_MONDE_TARGETS, grille: true },
        }
      case 'CHECKOUT_PRACTICE':
        return {
          recap: recapEntrainementFiche(reglages.sorties, minTarget, maxTarget),
          corps: (
            <>
              <ChoixSegmente
                legende={LEGENDE_NOMBRE_SORTIES}
                valeurs={SORTIES}
                valeur={reglages.sorties}
                onChange={reglages.setSorties}
                aide={aideSorties(reglages.sorties)}
              />
              <PlageRestes min={minTarget} max={maxTarget} />
            </>
          ),
          regle: REGLE_ENTRAINEMENT,
          regles: paragrapheEntrainement(minTarget, maxTarget),
          cibles: null,
        }
      default: {
        const jamais: never = mode
        return jamais
      }
    }
  })()

  return (
    <section aria-label={TITRE_FICHE_REGLAGES} className="border-t-[3px] border-craie bg-ardoise">
      <TeteFiche mode={mode} recap={contenu.recap} />
      {contenu.corps && <div className="flex flex-col gap-4 p-3">{contenu.corps}</div>}
      <p className="border-t border-craie/10 px-3 py-2.5 text-sm leading-snug text-craie-2">
        <Phrase segments={contenu.regle} />
      </p>
      <div className="px-3">
        <Depliant libelle={LIBELLE_REGLES_EN_ENTIER}>
          <div className="flex flex-col gap-3 pb-3">
            <p className="text-sm leading-snug text-craie-2">
              <Phrase segments={contenu.regles} />
            </p>
            {contenu.cibles && <CasesCibles {...contenu.cibles} />}
          </div>
        </Depliant>
      </div>
    </section>
  )
}
