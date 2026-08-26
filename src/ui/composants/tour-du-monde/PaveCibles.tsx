import { Undo2 } from 'lucide-react'
import { Dart, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'
import { ANNULATION_NEUTRE, type Annulation } from '@/ui/labels'

type Props = {
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
  readonly desactive: boolean
}

/**
 * ZONE SAISIE du Tour du monde — **sans bascule S/D/T**.
 *
 * Au Tour du monde, seul le secteur compte : un triple 20 vaut exactement ce
 * que vaut un simple 20, c'est-à-dire « touché ». Afficher un sélecteur de
 * multiplicateur qui ne change rien induirait en erreur, et rallongerait la
 * saisie sans raison. Les fléchettes enregistrées sont donc des simples.
 *
 * On gagne une rangée par rapport au pavé X01, ce qui laisse la place aux
 * grandes cibles de la zone de lecture.
 */
export const PaveCibles = ({
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
  desactive,
}: Props) => (
  <section aria-label="Saisie des cibles touchées" className="flex flex-col gap-1.5">
    <div className="grid grid-cols-5 gap-1.5">
      {SEGMENT_NUMBERS.map((numero) => (
        <button
          key={numero}
          type="button"
          disabled={desactive}
          onClick={() => onFlechette(Dart.single(numero))}
          className="touche chiffres min-h-[3.25rem] rounded-xl text-xl font-bold text-craie-vive paysage:min-h-12 paysage:text-lg"
        >
          {numero}
        </button>
      ))}
    </div>

    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.bull())}
        className={[
          'touche min-h-[3.25rem] flex-1 rounded-xl border-rouge-cible/70 bg-rouge-cible/25',
          'font-score text-base font-bold uppercase tracking-widest text-craie-vive',
          'paysage:min-h-12',
        ].join(' ')}
      >
        Bulle
      </button>

      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.miss())}
        className="touche min-h-[3.25rem] shrink-0 rounded-xl px-4 font-score text-base font-bold uppercase tracking-wider text-craie/65 paysage:min-h-12"
      >
        Hors
      </button>

      <button
        type="button"
        disabled={desactive || !peutAnnuler}
        onClick={onAnnuler}
        aria-label={annulation.complet}
        className="touche flex min-h-[3.25rem] shrink-0 items-center gap-1.5 rounded-xl px-3 font-score text-xs font-bold uppercase tracking-wider text-craie paysage:min-h-12"
      >
        <Undo2 aria-hidden="true" className="size-4 shrink-0" />
        {annulation.court}
      </button>
    </div>
  </section>
)
