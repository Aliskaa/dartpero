import { Undo2 } from 'lucide-react'
import { Dart, type Multiplier, type SegmentNumber } from '@/core/domain/value-objects/Dart'
import {
  ANNULATION_NEUTRE,
  type Annulation,
  LIBELLE_BULLE,
  LIBELLE_HORS,
  LIBELLE_MULTIPLICATEUR,
  LIBELLE_PAS_DE_TRIPLE_BULLE,
} from '@/ui/labels'

const MULTIPLICATEURS: readonly Multiplier[] = ['SIMPLE', 'DOUBLE', 'TRIPLE']

const FACTEUR: Record<Multiplier, number> = { SIMPLE: 1, DOUBLE: 2, TRIPLE: 3 }

type Props = {
  /** Le nom accessible de la section (`LIBELLE_SAISIE_*`). */
  readonly libelleSection: string
  /** Les cibles numérotées de la grille, dans l'ordre d'affichage. */
  readonly cibles: readonly SegmentNumber[]
  /** 5 colonnes (1 à 20) ou 3 (les six cibles du Cricket). */
  readonly colonnes: 5 | 3
  /**
   * La bascule S/D/T. Absente (Tour du monde) : pas de rail, pas de touche armée,
   * et toutes les fléchettes partent en Simple.
   */
  readonly multiplicateur?: Multiplier
  readonly onMultiplicateur?: (valeur: Multiplier) => void
  /**
   * Ce que dit le petit chiffre d'une touche armée : les `points` de la
   * fléchette (X01, entraînement) ou les `marques` qu'elle fait (Cricket).
   */
  readonly exposant?: 'points' | 'marques'
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

/**
 * LE pavé de saisie des quatre jeux (X01, entraînement, Cricket, Tour du monde) :
 * mêmes mots, mêmes tailles, Annuler au même endroit. La mémoire musculaire ne
 * change plus d'un jeu à l'autre.
 *
 * De haut en bas :
 *  1. la grille des cibles ;
 *  2. la rangée **Bulle · Hors · Annuler** (5 colonnes : 2 · 1 · 2) — ses x et ses
 *     largeurs viennent de ce seul conteneur, donc identiques dans les quatre jeux ;
 *  3. le rail Simple / Double / Triple en pleine largeur, seulement s'il y a une
 *     bascule. Sans rail (Tour du monde), la rangée est la dernière.
 *
 * Le multiplicateur est **momentané** : il retombe sur Simple dès qu'une
 * fléchette est saisie (la remise à zéro vit dans le hook du mode, pas ici). Il
 * se lit sur la `<section>` (`data-multiplicateur`) ; la classe `touche-armee`
 * désigne les touches qui s'en parent : les cibles et la Bulle, jamais Hors ni
 * Annuler (voir `index.css`).
 *
 * « Bulle » enregistre `BULL_SIMPLE` en Simple et `BULL_DOUBLE` en Double ; elle
 * se grise en Triple (il n'existe pas de triple bull) plutôt que de refuser le
 * coup après l'avoir accepté. « Hors » enregistre `MISS` et ignore la bascule.
 *
 * ⚠️ **Aucune touche ne porte d'utilitaire `text-craie*` / `text-laiton*`** : il
 * battrait `.touche:active` et l'inversion à l'appui (P1) ne se verrait plus.
 * La couleur de repos passe par `--texte-touche` ; garde `appuiBoundary`.
 *
 * ⚠️ **Le pavé ne se grise jamais pendant l'écriture d'une volée** (la garde vit
 * dans le hook : un appui pendant l'écriture n'enregistre rien). Les seules
 * touches éteintes sont la Bulle en Triple et « Annuler » sans rien à annuler.
 */
export const PaveSaisie = ({
  libelleSection,
  cibles,
  colonnes,
  multiplicateur,
  onMultiplicateur,
  exposant = 'points',
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
}: Props) => {
  const avecBascule = multiplicateur !== undefined
  const choisi: Multiplier = multiplicateur ?? 'SIMPLE'
  const rang = MULTIPLICATEURS.indexOf(choisi)
  const facteur = FACTEUR[choisi]
  const bulleInterdite = choisi === 'TRIPLE'
  // Les touches qui s'arment : seulement quand il y a une bascule.
  const armee = avecBascule ? 'touche-armee' : ''

  return (
    <section
      aria-label={libelleSection}
      data-multiplicateur={avecBascule ? choisi.toLowerCase() : undefined}
      className="flex flex-col gap-1.5 paysage:gap-1"
    >
      <div
        className={[
          'grid gap-1.5 paysage:gap-1',
          colonnes === 5 ? 'grid-cols-5' : 'grid-cols-3',
        ].join(' ')}
      >
        {cibles.map((numero) => (
          <button
            key={numero}
            type="button"
            onClick={() => onFlechette(Dart.of(numero, choisi))}
            className={`touche ${armee} chiffres relative min-h-[3.25rem] text-xl font-bold paysage:min-h-12 paysage:text-lg`}
          >
            {/* La valeur n'apparaît que si elle diffère du numéro : en simple elle
                serait du bruit, en triple elle évite la faute. */}
            {avecBascule && facteur > 1 && (
              <span
                aria-hidden="true"
                className="exposant-touche absolute right-1.5 top-1 text-multiplicateur font-bold leading-none"
              >
                {exposant === 'marques' ? `×${facteur}` : numero * facteur}
              </span>
            )}
            {numero}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5 paysage:gap-1">
        <button
          type="button"
          disabled={bulleInterdite}
          onClick={() => onFlechette(Dart.of('BULL', choisi))}
          title={bulleInterdite ? LIBELLE_PAS_DE_TRIPLE_BULLE : undefined}
          className={`touche touche-bulle ${armee} relative col-span-2 min-h-[3.25rem] font-score text-base font-bold uppercase tracking-widest paysage:min-h-12`}
        >
          {avecBascule && exposant === 'points' && choisi !== 'TRIPLE' && (
            // « 25 » est une valeur de repos (neutre) ; « 50 » dit que la bascule est armée.
            <span
              aria-hidden="true"
              className={`${choisi === 'DOUBLE' ? 'exposant-touche' : 'exposant-touche-neutre'} absolute right-1.5 top-1 text-multiplicateur font-bold leading-none`}
            >
              {choisi === 'DOUBLE' ? 50 : 25}
            </span>
          )}
          {avecBascule && exposant === 'marques' && facteur > 1 && choisi !== 'TRIPLE' && (
            <span
              aria-hidden="true"
              className="exposant-touche absolute right-1.5 top-1 text-multiplicateur font-bold leading-none"
            >
              ×{facteur}
            </span>
          )}
          {LIBELLE_BULLE}
        </button>

        <button
          type="button"
          /* Une fléchette manquée n'a ni double ni triple : elle ignore la bascule. */
          onClick={() => onFlechette(Dart.miss())}
          className="touche touche-hors col-span-1 min-h-[3.25rem] font-score text-base font-bold uppercase tracking-widest [--texte-touche:var(--color-rouge-touche)] paysage:min-h-12"
        >
          {LIBELLE_HORS}
        </button>

        <button
          type="button"
          disabled={!peutAnnuler}
          onClick={onAnnuler}
          aria-label={annulation.complet}
          className={[
            'touche col-span-2 flex min-h-[3.25rem] items-center justify-center gap-1.5 px-2',
            'font-score text-etiquette font-bold uppercase tracking-widest',
            '[--texte-touche:var(--color-craie)] paysage:min-h-12',
          ].join(' ')}
        >
          <Undo2 aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{annulation.court}</span>
        </button>
      </div>

      {/* Le rail, en pleine largeur sous la rangée : le bord bas, là où le pouce
          retombe. Le curseur de laiton glisse d'un onglet à l'autre — et revient
          tout seul sur Simple, ce qui rend la remise à zéro visible. */}
      {avecBascule && (
        <div className="relative grid grid-cols-3 border border-chene/60 bg-feutre/70 p-[var(--rail-p)] [--rail-p:0.25rem] paysage:[--rail-p:0.125rem]">
          <span
            aria-hidden="true"
            style={{
              width: 'calc((100% - 2 * var(--rail-p)) / 3)',
              transform: `translateX(${rang * 100}%)`,
            }}
            className="laiton-plat absolute inset-y-[var(--rail-p)] left-[var(--rail-p)] transition-transform duration-200 ease-out"
          />
          {MULTIPLICATEURS.map((valeur) => {
            const actif = valeur === choisi
            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => onMultiplicateur?.(valeur)}
                className={[
                  'relative z-10 min-h-12 font-score text-sm font-bold uppercase',
                  'tracking-widest transition-colors duration-150',
                  actif ? 'text-sur-laiton' : 'text-craie-2',
                ].join(' ')}
              >
                {LIBELLE_MULTIPLICATEUR[valeur]}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
