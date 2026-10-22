import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'

type Props = {
  /** Les fléchettes de la volée ; les cases au-delà restent vides (« — »). */
  readonly darts: readonly Dart[]
  readonly 'aria-label': string
  /** Volée annulée (bust du X01) : fléchettes barrées, en rouge. */
  readonly bust?: boolean
  /** `ligne` : trois cases sous le nom ; `ruban` : poussées à droite d'une ligne dédiée (Cricket). */
  readonly variante?: 'ligne' | 'ruban'
  /** Écriture d'une fléchette dans sa case ; défaut `Dart.label`. */
  readonly libelle?: (dart: Dart) => string
}

/** Les trois fléchettes d'une volée, jamais grisées. ⚠️ Cases `minmax(0, 2.75rem)` : plafonnées, mais elles rétrécissent sans déborder. */
export const CasesVolee = ({
  darts,
  bust = false,
  variante = 'ligne',
  libelle = DartVO.label,
  'aria-label': ariaLabel,
}: Props) => {
  const ruban = variante === 'ruban'

  return (
    <output
      aria-label={ariaLabel}
      className={
        ruban
          ? 'ml-auto flex items-end gap-2'
          : 'grid grid-cols-[repeat(3,minmax(0,2.75rem))] items-end justify-start gap-1'
      }
    >
      {[0, 1, 2].map((rang) => {
        const dart = darts[rang]
        return (
          <span
            key={rang}
            className={[
              'ligne-saisie chiffres overflow-hidden pb-0.5 text-center font-bold leading-none',
              ruban ? 'min-w-12 text-base' : 'min-w-0 text-sm',
              dart ? (bust ? 'text-rouge-cible line-through' : 'text-craie-vive') : 'text-craie-3',
            ].join(' ')}
          >
            {dart ? libelle(dart) : '—'}
          </span>
        )
      })}
    </output>
  )
}
