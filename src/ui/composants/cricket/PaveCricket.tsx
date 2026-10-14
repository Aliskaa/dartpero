import { Undo2 } from 'lucide-react'
import { Dart, type Multiplier, type Segment } from '@/core/domain/value-objects/Dart'
import { ANNULATION_NEUTRE, type Annulation } from '@/ui/labels'

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
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

/**
 * ZONE SAISIE du Cricket — **seulement les sept cibles**.
 *
 * Le pavé du X01 aligne les vingt secteurs ; ici dix-neuf d'entre eux ne font
 * strictement rien. Les proposer inviterait à saisir des fléchettes sans effet
 * et ferait douter : « je l'ai tapée, pourquoi rien n'a bougé ? ». Tout ce qui
 * tombe hors des sept cibles se saisit donc avec « Hors », qui dit exactement
 * ce qui s'est passé au jeu : rien.
 *
 * La bascule S/D/T est momentanée (remise à Simple dans `useCricket`) ; l'exposant
 * annonce les marques plutôt que les points.
 */
export const PaveCricket = ({
  cibles,
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
}: Props) => {
  const rang = MULTIPLICATEURS.findIndex((option) => option.valeur === multiplicateur)
  const marques = MARQUES[multiplicateur]
  // Il n'existe pas de triple bull : la touche se grise plutôt que de refuser
  // le coup après l'avoir accepté.
  const bullInterdit = multiplicateur === 'TRIPLE'

  return (
    <section
      aria-label="Saisie des cibles touchées"
      className="flex flex-col gap-1.5 paysage:gap-1"
    >
      <div className="grid grid-cols-4 gap-1.5 paysage:gap-1">
        {cibles.map((cible) => {
          const bulle = cible === 'BULL'
          return (
            <button
              key={String(cible)}
              type="button"
              disabled={bulle && bullInterdit}
              onClick={() => onFlechette(Dart.of(cible, multiplicateur))}
              title={bulle && bullInterdit ? 'Il n’existe pas de triple bull' : undefined}
              className={[
                'touche chiffres relative min-h-14 text-2xl font-bold text-craie-vive',
                'paysage:min-h-12 paysage:text-xl',
                bulle ? 'border-rouge-cible/70 bg-rouge-cible/25' : '',
              ].join(' ')}
            >
              {marques > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1 font-score text-etiquette font-bold leading-none text-accent-mode-clair"
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
          /* Une fléchette hors des sept cibles ne vaut rien : elle ignore la bascule. */
          onClick={() => onFlechette(Dart.miss())}
          className="touche min-h-14 font-score text-base font-bold uppercase tracking-wider text-craie-3 paysage:min-h-12"
        >
          Hors
        </button>
      </div>

      {/* La rangée du pouce, identique à celle du X01. */}
      <div className="flex gap-1.5">
        <div className="relative grid flex-1 grid-cols-3 border border-chene/45 bg-feutre/70 p-[var(--rail-p)] [--rail-p:0.25rem] paysage:[--rail-p:0.125rem]">
          <span
            aria-hidden="true"
            style={{
              width: 'calc((100% - 2 * var(--rail-p)) / 3)',
              transform: `translateX(${rang * 100}%)`,
            }}
            className="laiton-plat absolute inset-y-[var(--rail-p)] left-[var(--rail-p)] transition-transform duration-200 ease-out"
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

        <button
          type="button"
          disabled={!peutAnnuler}
          onClick={onAnnuler}
          aria-label={annulation.complet}
          className="touche flex min-h-12 shrink-0 items-center gap-1.5 px-3 font-score text-xs font-bold uppercase tracking-wider text-craie"
        >
          <Undo2 aria-hidden="true" className="size-4 shrink-0" />
          {annulation.court}
        </button>
      </div>
    </section>
  )
}
