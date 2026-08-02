import { Dart, type Multiplier, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'

const MULTIPLICATEURS: readonly { readonly valeur: Multiplier; readonly libelle: string }[] = [
  { valeur: 'SIMPLE', libelle: 'Simple' },
  { valeur: 'DOUBLE', libelle: 'Double' },
  { valeur: 'TRIPLE', libelle: 'Triple' },
]

type Props = {
  readonly multiplicateur: Multiplier
  readonly onMultiplicateur: (valeur: Multiplier) => void
  readonly onFlechette: (dart: Dart) => void
  readonly desactive: boolean
}

/**
 * ZONE SAISIE — compacte, atteignable au pouce, cibles ≥ 48 px.
 *
 * La bascule S/D/T est **persistante** : on enchaîne trois triples sans la
 * re-sélectionner. Le bull a ses propres touches parce que le triple n'y
 * existe pas, et qu'il faut distinguer les 25 du bullseye à 50.
 */
export const PaveFlechettes = ({
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  desactive,
}: Props) => (
  <section aria-label="Saisie fléchette par fléchette" className="flex flex-col gap-2">
    <div className="grid grid-cols-3 gap-2">
      {MULTIPLICATEURS.map(({ valeur, libelle }) => {
        const actif = valeur === multiplicateur
        return (
          <button
            key={valeur}
            type="button"
            aria-pressed={actif}
            onClick={() => onMultiplicateur(valeur)}
            className={[
              'min-h-12 rounded-xl font-score text-sm font-bold uppercase tracking-widest',
              actif ? 'laiton-poli' : 'border-2 border-chene bg-ardoise text-craie/80',
            ].join(' ')}
          >
            {libelle}
          </button>
        )
      })}
    </div>

    <div className="grid grid-cols-5 gap-2">
      {SEGMENT_NUMBERS.map((numero) => (
        <button
          key={numero}
          type="button"
          disabled={desactive}
          onClick={() => onFlechette(Dart.of(numero, multiplicateur))}
          className="chiffres ardoise-craie min-h-12 rounded-xl text-xl font-bold text-craie-vive disabled:opacity-40 active:bg-laiton/25"
        >
          {numero}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.bull())}
        className="chiffres ardoise-craie min-h-12 rounded-xl text-lg font-bold text-craie-vive disabled:opacity-40 active:bg-laiton/25"
      >
        25
      </button>
      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.bullseye())}
        className="min-h-12 rounded-xl border-2 border-rouge-cible bg-rouge-cible/20 font-score text-base font-bold uppercase tracking-widest text-craie-vive disabled:opacity-40"
      >
        Bull
      </button>
      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.miss())}
        className="chiffres ardoise-craie min-h-12 rounded-xl text-lg font-bold text-craie/70 disabled:opacity-40 active:bg-laiton/25"
      >
        0
      </button>
    </div>
  </section>
)
