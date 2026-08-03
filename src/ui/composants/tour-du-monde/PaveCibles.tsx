import { Undo2 } from 'lucide-react'
import { Dart, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'

type Props = {
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
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
export const PaveCibles = ({ onFlechette, onAnnuler, peutAnnuler, desactive }: Props) => (
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

    <div className="grid grid-cols-4 gap-1.5">
      <button
        type="button"
        disabled={desactive}
        onClick={() => onFlechette(Dart.bull())}
        className={[
          'touche col-span-2 min-h-[3.25rem] rounded-xl border-rouge-cible/70 bg-rouge-cible/25',
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
        className="touche chiffres min-h-[3.25rem] rounded-xl text-lg font-bold text-craie/60 paysage:min-h-12"
      >
        0
      </button>

      <button
        type="button"
        disabled={desactive || !peutAnnuler}
        onClick={onAnnuler}
        aria-label="Annuler"
        className="touche flex min-h-[3.25rem] items-center justify-center rounded-xl border-chene text-craie paysage:min-h-12"
      >
        <Undo2 aria-hidden="true" className="size-5" />
      </button>
    </div>
  </section>
)
