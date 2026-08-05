import { Undo2 } from 'lucide-react'
import { Dart, type Multiplier, type Segment } from '@/core/domain/value-objects/Dart'

const MULTIPLICATEURS: readonly { readonly valeur: Multiplier; readonly libelle: string }[] = [
  { valeur: 'SIMPLE', libelle: 'Simple' },
  { valeur: 'DOUBLE', libelle: 'Double' },
  { valeur: 'TRIPLE', libelle: 'Triple' },
]

const MARQUES: Record<Multiplier, number> = { SIMPLE: 1, DOUBLE: 2, TRIPLE: 3 }

type Props = {
  readonly cibles: readonly Segment[]
  readonly multiplicateur: Multiplier
  readonly onMultiplicateur: (valeur: Multiplier) => void
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  readonly desactive: boolean
}

/**
 * ZONE SAISIE du Cricket — **seulement les sept cibles**.
 *
 * Le pavé du X01 aligne les vingt secteurs ; ici dix-neuf d'entre eux ne font
 * strictement rien. Les proposer inviterait à saisir des fléchettes sans effet
 * et ferait douter : « je l'ai tapée, pourquoi rien n'a bougé ? ». Tout ce qui
 * tombe hors des sept cibles se saisit donc avec la touche `0`, qui dit
 * exactement ce qui s'est passé au jeu : rien.
 *
 * En échange, les touches sont énormes — la lisibilité que le cadrage réclame,
 * enfin obtenue sans compromis.
 *
 * La bascule S/D/T est celle du X01, et pour la même raison : ici elle vaut une,
 * deux ou trois **marques**. Elle est donc **momentanée** (la remise à Simple
 * vit dans `useCricket`), et l'exposant annonce les marques plutôt que les
 * points — c'est ce qui compte au Cricket.
 */
export const PaveCricket = ({
  cibles,
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  onAnnuler,
  peutAnnuler,
  desactive,
}: Props) => {
  const rang = MULTIPLICATEURS.findIndex((option) => option.valeur === multiplicateur)
  const marques = MARQUES[multiplicateur]
  // Il n'existe pas de triple bull : la touche se grise plutôt que de refuser
  // le coup après l'avoir accepté.
  const bullInterdit = multiplicateur === 'TRIPLE'

  return (
    <section aria-label="Saisie des cibles touchées" className="flex flex-col gap-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {cibles.map((cible) => {
          const bulle = cible === 'BULL'
          return (
            <button
              key={String(cible)}
              type="button"
              disabled={desactive || (bulle && bullInterdit)}
              onClick={() => onFlechette(Dart.of(cible, multiplicateur))}
              title={bulle && bullInterdit ? 'Il n’existe pas de triple bull' : undefined}
              className={[
                'touche chiffres relative min-h-16 rounded-xl text-2xl font-bold text-craie-vive',
                'paysage:min-h-12 paysage:text-xl',
                bulle ? 'border-rouge-cible/70 bg-rouge-cible/25' : '',
              ].join(' ')}
            >
              {marques > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1 font-score text-[0.6rem] font-bold leading-none text-laiton"
                >
                  ×{marques}
                </span>
              )}
              {bulle ? 'Bulle' : cible}
            </button>
          )
        })}

        <button
          type="button"
          disabled={desactive}
          /* Une fléchette hors des sept cibles ne vaut rien : elle ignore la bascule. */
          onClick={() => onFlechette(Dart.miss())}
          className="touche chiffres min-h-16 rounded-xl text-xl font-bold text-craie/60 paysage:min-h-12"
        >
          0
        </button>
      </div>

      {/* La rangée du pouce, identique à celle du X01. */}
      <div className="flex gap-1.5">
        <div className="relative grid flex-1 grid-cols-3 rounded-xl border border-chene/60 bg-feutre/70 p-1">
          <span
            aria-hidden="true"
            style={{
              width: 'calc((100% - 0.5rem) / 3)',
              transform: `translateX(${rang * 100}%)`,
            }}
            className="laiton-plat absolute inset-y-1 left-1 rounded-lg transition-transform duration-200 ease-out"
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

        <button
          type="button"
          disabled={desactive || !peutAnnuler}
          onClick={onAnnuler}
          aria-label="Annuler"
          className="touche flex min-h-14 w-14 shrink-0 items-center justify-center rounded-xl border-chene text-craie"
        >
          <Undo2 aria-hidden="true" className="size-5" />
        </button>
      </div>
    </section>
  )
}
