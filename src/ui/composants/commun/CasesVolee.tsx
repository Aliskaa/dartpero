import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'

type Props = {
  /** Les fléchettes de la volée ; les cases au-delà restent vides (« — »). */
  readonly darts: readonly Dart[]
  readonly 'aria-label': string
  /** Volée annulée (bust du X01) : fléchettes barrées, en rouge. */
  readonly bust?: boolean
  /**
   * `ligne` : trois cases sous le nom, à gauche, `text-sm` (X01, Tour du monde).
   * `ruban` : trois cases poussées à droite d'une ligne dédiée, 48 px de large,
   * `text-base` (la ligne « VOLÉE » du Cricket).
   */
  readonly variante?: 'ligne' | 'ruban'
  /**
   * Comment s'écrit une fléchette dans sa case. Par défaut `Dart.label` ; le Tour
   * du monde passe un libellé sans « S » (`libelleFlechetteTourDuMonde`).
   */
  readonly libelle?: (dart: Dart) => string
}

/**
 * Les trois fléchettes d'une volée, écrites sur leur ligne comme au stylo.
 *
 * Le libellé vient de `Dart.label` (« T20 », « D16 », « BULL », « 0 »), jamais
 * recopié ici. Les fléchettes qui n'avancent pas ne sont **pas** grisées : on
 * veut voir ce qui a été lancé, pas ce qui a servi.
 *
 * Variante `ligne` : trois cases de grille `minmax(0, 2.75rem)` — une largeur de
 * case à fléchette, PLAFONNÉE, et qui se resserre d'elle-même si la colonne
 * maigrit. Sans le plafond, les cases s'étalent sur toute la colonne ; sans le
 * plancher à 0, elles refusent de rétrécir et débordent sur la colonne d'à côté.
 * Le `gap-1` est ce qui laisse tenir « BULL » (29,4 px) dans sa case.
 */
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
