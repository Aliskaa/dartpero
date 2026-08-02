import { Dart, type Multiplier, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'

const MULTIPLICATEURS: readonly { readonly valeur: Multiplier; readonly libelle: string }[] = [
  { valeur: 'SIMPLE', libelle: 'Simple' },
  { valeur: 'DOUBLE', libelle: 'Double' },
  { valeur: 'TRIPLE', libelle: 'Triple' },
]

const FACTEUR: Record<Multiplier, number> = { SIMPLE: 1, DOUBLE: 2, TRIPLE: 3 }

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
 * re-sélectionner. Comme c'est aussi la source d'erreur n° 1 (on croit être en
 * triple alors qu'on est en simple), le curseur de laiton glisse d'un onglet à
 * l'autre et chaque touche affiche ce qu'elle vaut vraiment dès qu'on quitte le
 * simple.
 *
 * Le bull a ses propres touches — le triple n'y existe pas — et elles portent
 * les couleurs du plateau : anneau vert à 25, bullseye rouge à 50.
 */
export const PaveFlechettes = ({
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  desactive,
}: Props) => {
  const rang = MULTIPLICATEURS.findIndex((option) => option.valeur === multiplicateur)
  const facteur = FACTEUR[multiplicateur]

  return (
    <section aria-label="Saisie fléchette par fléchette" className="flex flex-col gap-2">
      <div className="relative grid grid-cols-3 rounded-xl border border-chene/60 bg-feutre/70 p-1">
        {/* Le curseur glisse : on voit le changement de multiplicateur même du coin de l'œil. */}
        <span
          aria-hidden="true"
          style={{
            width: 'calc((100% - 0.5rem) / 3)',
            transform: `translateX(${rang * 100}%)`,
          }}
          className="laiton-poli absolute inset-y-1 left-1 rounded-lg transition-transform duration-200 ease-out"
        />
        {MULTIPLICATEURS.map(({ valeur, libelle }) => {
          const actif = valeur === multiplicateur
          return (
            <button
              key={valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onMultiplicateur(valeur)}
              className={[
                'relative z-10 min-h-12 rounded-lg font-score text-sm font-bold uppercase',
                'tracking-widest transition-colors duration-150',
                actif ? 'text-[#1a1206]' : 'text-craie/75',
              ].join(' ')}
            >
              {libelle}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {SEGMENT_NUMBERS.map((numero) => (
          <button
            key={numero}
            type="button"
            disabled={desactive}
            onClick={() => onFlechette(Dart.of(numero, multiplicateur))}
            className="touche chiffres relative min-h-[3.25rem] rounded-xl text-xl font-bold text-craie-vive"
          >
            {/* La valeur réelle n'apparaît que si elle diffère du numéro : en
                simple elle serait du bruit, en triple elle évite la faute. */}
            {facteur > 1 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1 text-[0.6rem] font-bold leading-none text-laiton"
              >
                {numero * facteur}
              </span>
            )}
            {numero}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={desactive}
          onClick={() => onFlechette(Dart.bull())}
          className="touche chiffres min-h-[3.25rem] rounded-xl border-vert-cible/60 text-lg font-bold text-craie-vive"
        >
          25
        </button>
        <button
          type="button"
          disabled={desactive}
          onClick={() => onFlechette(Dart.bullseye())}
          className={[
            'touche min-h-[3.25rem] rounded-xl border-rouge-cible/70 bg-rouge-cible/25',
            'font-score text-base font-bold uppercase tracking-widest text-craie-vive',
          ].join(' ')}
        >
          Bull
        </button>
        <button
          type="button"
          disabled={desactive}
          onClick={() => onFlechette(Dart.miss())}
          className="touche chiffres min-h-[3.25rem] rounded-xl text-lg font-bold text-craie/60"
        >
          0
        </button>
      </div>
    </section>
  )
}
