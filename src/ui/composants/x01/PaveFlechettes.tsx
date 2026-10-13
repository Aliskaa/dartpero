import { Undo2 } from 'lucide-react'
import { Dart, type Multiplier, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'
import { ANNULATION_NEUTRE, type Annulation } from '@/ui/labels'

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
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
  readonly desactive: boolean
}

/**
 * ZONE SAISIE — compacte, atteignable au pouce, cibles ≥ 48 px.
 *
 * Le multiplicateur est **momentané** : il retombe sur Simple dès qu'une
 * fléchette est saisie (la remise à zéro vit dans `useX01`, pas ici). Un
 * multiplicateur qui reste armé sans qu'on le voie est la source d'erreur n° 1
 * — trois T20 comptés là où il y avait trois simples. On préfère un clic de
 * plus par triple à un score faux qu'il faut retrouver.
 *
 * La bascule vit tout **en bas**, avec celle du mode de saisie : le bas de
 * l'écran est la seule zone qu'on atteint sans changer la prise du téléphone,
 * et c'est là que doivent être les contrôles qu'on actionne le plus.
 * Le curseur de laiton glisse d'un onglet à l'autre — et **revient** tout seul
 * sur Simple, ce qui rend la remise à zéro visible plutôt que silencieuse.
 *
 * Il n'y a **pas** de touche « Bull » : le bullseye, c'est le double du 25 —
 * ce que dit la règle. En triple, le 25 se grise plutôt que de refuser le coup
 * après l'avoir accepté : il n'existe pas de triple bull sur une cible.
 */
export const PaveFlechettes = ({
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
  desactive,
}: Props) => {
  const rang = MULTIPLICATEURS.findIndex((option) => option.valeur === multiplicateur)
  const facteur = FACTEUR[multiplicateur]
  const bullInterdit = multiplicateur === 'TRIPLE'

  return (
    <section aria-label="Saisie fléchette par fléchette" className="flex flex-col gap-1.5">
      <div className="grid grid-cols-5 gap-1.5">
        {SEGMENT_NUMBERS.map((numero) => (
          <button
            key={numero}
            type="button"
            disabled={desactive}
            onClick={() => onFlechette(Dart.of(numero, multiplicateur))}
            className="touche chiffres relative min-h-[3.25rem] text-xl font-bold text-craie-vive paysage:min-h-12 paysage:text-lg"
          >
            {/* La valeur réelle n'apparaît que si elle diffère du numéro : en
                simple elle serait du bruit, en triple elle évite la faute. */}
            {facteur > 1 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1 text-etiquette font-bold leading-none text-laiton"
              >
                {numero * facteur}
              </span>
            )}
            {numero}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          disabled={desactive || bullInterdit}
          onClick={() => onFlechette(Dart.of('BULL', multiplicateur))}
          title={bullInterdit ? 'Il n’existe pas de triple bull' : undefined}
          className="touche chiffres relative min-h-[3.25rem] text-lg font-bold text-craie-vive paysage:min-h-12"
        >
          {multiplicateur === 'DOUBLE' && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1 text-etiquette font-bold leading-none text-laiton"
            >
              50
            </span>
          )}
          25
        </button>

        <button
          type="button"
          disabled={desactive}
          /* Une fléchette manquée n'a ni double ni triple : elle ignore la bascule. */
          onClick={() => onFlechette(Dart.miss())}
          className="touche chiffres min-h-[3.25rem] text-lg font-bold text-craie-3 paysage:min-h-12"
        >
          0
        </button>

        <button
          type="button"
          disabled={desactive || !peutAnnuler}
          onClick={onAnnuler}
          aria-label={annulation.complet}
          className={[
            'touche col-span-2 flex min-h-[3.25rem] items-center justify-center gap-2 px-2',
            'font-score text-sm font-bold uppercase tracking-widest text-craie',
            'paysage:min-h-12',
          ].join(' ')}
        >
          <Undo2 aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{annulation.court}</span>
        </button>
      </div>

      {/* La rangée du pouce : ce qu'on actionne le plus, là où on l'atteint le mieux. */}
      <div className="flex gap-1.5">
        <div className="relative grid flex-1 grid-cols-3 border border-chene/60 bg-feutre/70 p-1">
          {/* Le curseur glisse : on voit le changement même du coin de l'œil. */}
          <span
            aria-hidden="true"
            style={{
              width: 'calc((100% - 0.5rem) / 3)',
              transform: `translateX(${rang * 100}%)`,
            }}
            className="laiton-plat absolute inset-y-1 left-1 transition-transform duration-200 ease-out"
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
                  'relative z-10 min-h-12 font-score text-sm font-bold uppercase',
                  'tracking-widest transition-colors duration-150',
                  actif ? 'text-sur-laiton' : 'text-craie-2',
                ].join(' ')}
              >
                {libelle}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
