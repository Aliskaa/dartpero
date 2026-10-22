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
  /** Bascule S/D/T ; absente (Tour du monde) : pas de rail, tout part en Simple. */
  readonly multiplicateur?: Multiplier
  readonly onMultiplicateur?: (valeur: Multiplier) => void
  /** Petit chiffre d'une touche armée : les `points` (X01, entraînement) ou les `marques` (Cricket). */
  readonly exposant?: 'points' | 'marques'
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

/** Pavé de saisie commun des quatre jeux : grille des cibles, rangée Bulle · Hors · Annuler, rail S/D/T s'il y a une bascule. */
// ⚠️ Aucune touche ne porte `text-craie*`/`text-laiton*` (il battrait `.touche:active`) ; le pavé ne se grise jamais pendant l'écriture d'une volée.
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
