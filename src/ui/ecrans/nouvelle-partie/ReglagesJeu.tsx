import { ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { CRICKET_VARIANTS } from '@/core/domain/games/cricket/config'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { LigneReglage } from '@/ui/composants/commun/LigneReglage'
import { Phrase } from '@/ui/composants/commun/Phrase'
import { PICTOGRAMME_PAR_MODE, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import type { ReglagesNouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  AIDE_SORTIE,
  AIDE_VARIANTE_KILLER,
  aideManches,
  aideSorties,
  aideVies,
  CARTES_CRICKET,
  CHOIX_ENTREE_SORTIE,
  type ChoixEntreeSortie,
  LEGENDE_COMPTAGE,
  LEGENDE_ENTREE,
  LEGENDE_MANCHES_A_GAGNER,
  LEGENDE_NOMBRE_SORTIES,
  LEGENDE_PLAGE_RESTES,
  LEGENDE_RECAP_REGLAGES,
  LEGENDE_SCORE_DEPART,
  LEGENDE_SETS_A_GAGNER,
  LEGENDE_SORTIE,
  LEGENDE_VIES_DEPART,
  LIBELLE_CHOIX_ENTREE_SORTIE,
  LIBELLE_CHOIX_SORTIE,
  LIBELLE_NON_REGLABLE,
  LIBELLE_PLUS_DE_REGLAGES,
  LIBELLE_SANS_SETS,
  LIBELLE_VARIANTE_CRICKET,
  LIBELLE_VARIANTE_KILLER,
  RECAP_TOUR_DU_MONDE,
  REGLE_ENTRAINEMENT,
  REGLE_KILLER,
  REGLE_TOUR_DU_MONDE,
  REGLE_X01,
  type RecapReglages,
  recapCricket,
  recapEntrainementFiche,
  recapKiller,
  recapX01,
  regleCricket,
  type Segment,
  TITRE_FICHE_REGLAGES,
} from '@/ui/labels'
import { LEGS, SCORES, SETS, SORTIES, VIES } from '@/ui/reglagesPossibles'

/** Une phrase écrite dans `labels.ts` : ses mots forts en `craie`. */
const PhraseFiche = ({ segments }: { readonly segments: readonly Segment[] }) => (
  <Phrase segments={segments} classeFort="text-craie" />
)

/**
 * Un pli : fermé à chaque ouverture de l'écran (l'état est local, l'étape se
 * démonte en changeant de route). Le contenu n'existe que déplié. Sert à
 * « Plus de réglages » ; les règles complètes sont dans la feuille de règles.
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
        libelle={(choix) => LIBELLE_CHOIX_SORTIE[choix]}
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
              <PhraseFiche segments={CARTES_CRICKET[variante].points} />
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

type Props = {
  readonly mode: GameModeId
  readonly reglages: ReglagesNouvellePartie
  /** Le nombre de joueurs retenus : l'aide des manches en dépend. */
  readonly joueurs: number
}

/**
 * La fiche de réglages du jeu choisi : pictogramme et récapitulatif en grand,
 * les réglages, une ligne de règles. Les règles complètes — sept cibles du
 * Cricket et parcours du Tour du monde compris — sont dans la feuille de règles,
 * derrière le livre de l'en-tête (lot `regles-du-jeu`). Un `switch` exhaustif :
 * un mode oublié ne compile pas.
 */
export const ReglagesJeu = ({ mode, reglages, joueurs }: Props) => {
  const { minTarget, maxTarget } = DEFAUT_ENTRAINEMENT

  const contenu = ((): {
    readonly recap: RecapReglages
    readonly corps: ReactNode
    readonly regle: readonly Segment[]
  } => {
    switch (mode) {
      case 'X01':
        return {
          recap: recapX01(reglages),
          corps: <CorpsX01 reglages={reglages} joueurs={joueurs} />,
          regle: REGLE_X01,
        }
      case 'CRICKET':
        return {
          recap: recapCricket(reglages.variante),
          corps: <CorpsCricket reglages={reglages} />,
          regle: regleCricket(reglages.variante === 'CUT_THROAT'),
        }
      case 'TOUR_DU_MONDE':
        // Rien à régler : le parcours est le parcours.
        return {
          recap: RECAP_TOUR_DU_MONDE,
          corps: null,
          regle: REGLE_TOUR_DU_MONDE,
        }
      case 'KILLER':
        return {
          recap: recapKiller(reglages.vies, joueurs, reglages.varianteKiller),
          corps: (
            <>
              <ChoixSegmente
                legende={LEGENDE_VIES_DEPART}
                valeurs={VIES}
                valeur={reglages.vies}
                onChange={reglages.setVies}
                aide={aideVies(reglages.vies)}
              />
              {/* La ligne à bascule des Réglages (46 × 26), désactivée par défaut. */}
              <ul className="-mx-3 -mb-3 border-t border-craie/10">
                <LigneReglage
                  titre={LIBELLE_VARIANTE_KILLER}
                  aide={AIDE_VARIANTE_KILLER}
                  action={{
                    type: 'bascule',
                    active: reglages.varianteKiller,
                    onClick: () => reglages.setVarianteKiller(!reglages.varianteKiller),
                  }}
                />
              </ul>
            </>
          ),
          regle: REGLE_KILLER,
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
        <PhraseFiche segments={contenu.regle} />
      </p>
    </section>
  )
}
