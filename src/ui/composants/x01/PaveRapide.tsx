import { Check, Delete, Eraser, Undo2, Zap } from 'lucide-react'
import { useState } from 'react'

const RACCOURCIS = [26, 41, 45, 60, 85, 100, 140, 180] as const
const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

type Props = {
  readonly reste: number
  readonly onScore: (total: number, dartsUsed: number) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  readonly rapide: boolean
  readonly onRapide: () => void
  readonly desactive: boolean
}

/**
 * ZONE SAISIE — mode rapide : un score de volée plutôt que trois fléchettes.
 *
 * L'écran annonce en direct le reste qui en découlerait, et signale un bust
 * avant qu'on valide : en mode rapide on tape un total de tête, une erreur de
 * dizaine est vite arrivée.
 *
 * Quand le score annoncé clôt le leg, on demande **combien de fléchettes** ont
 * servi : c'est la seule information que le total ne porte pas, et elle change
 * la moyenne comme le « meilleur leg ».
 *
 * Comme dans le pavé fléchette par fléchette, « Annuler » et la bascule de mode
 * occupent la dernière rangée — toujours au même endroit, sous le pouce.
 */
export const PaveRapide = ({
  reste,
  onScore,
  onAnnuler,
  peutAnnuler,
  rapide,
  onRapide,
  desactive,
}: Props) => {
  const [saisie, setSaisie] = useState('')

  const total = saisie === '' ? null : Number(saisie)
  const valide = total !== null && total >= 0 && total <= 180
  const sortie = valide && total === reste
  const resteApres = total === null ? reste : reste - total
  const bust = valide && (resteApres < 0 || resteApres === 1)

  const taper = (touche: string) => {
    const suite = (saisie + touche).replace(/^0+(?=\d)/, '')
    if (Number(suite) > 180) return
    setSaisie(suite)
  }

  const valider = (dartsUsed: number) => {
    if (total === null) return
    onScore(total, dartsUsed)
    setSaisie('')
  }

  return (
    <section aria-label="Saisie rapide" className="flex flex-col gap-1.5">
      <div
        className={[
          'flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4',
          'transition-colors duration-150 paysage:min-h-11',
          bust
            ? 'border-rouge-cible/70 bg-rouge-cible/15'
            : sortie
              ? 'border-vert-cible/70 bg-vert-cible/15'
              : 'border-chene/60 bg-feutre/70',
        ].join(' ')}
      >
        <output
          aria-label="Score de la volée"
          className="chiffres text-4xl font-bold leading-none text-craie-vive"
        >
          {saisie === '' ? <span className="text-craie/25">—</span> : saisie}
        </output>

        <span className="font-score text-xs uppercase tracking-widest">
          {bust ? (
            <span className="font-bold text-rouge-cible">Bust</span>
          ) : sortie ? (
            <span className="font-bold text-vert-cible">Sortie</span>
          ) : (
            <span className="text-craie/60">
              reste <span className="chiffres text-base font-bold text-craie">{resteApres}</span>
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {RACCOURCIS.map((score) => (
          <button
            key={score}
            type="button"
            disabled={desactive}
            onClick={() => setSaisie(String(score))}
            className="touche chiffres min-h-12 rounded-xl text-base font-bold text-craie"
          >
            {score}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {TOUCHES.map((touche) => (
          <button
            key={touche}
            type="button"
            disabled={desactive}
            onClick={() => taper(touche)}
            className="touche chiffres min-h-12 rounded-xl text-xl font-bold text-craie-vive"
          >
            {touche}
          </button>
        ))}
        <button
          type="button"
          aria-label="Effacer le dernier chiffre"
          disabled={desactive || saisie === ''}
          onClick={() => setSaisie(saisie.slice(0, -1))}
          className="touche flex min-h-12 items-center justify-center rounded-xl text-craie/80"
        >
          <Delete aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          disabled={desactive}
          onClick={() => taper('0')}
          className="touche chiffres min-h-12 rounded-xl text-xl font-bold text-craie-vive"
        >
          0
        </button>
        <button
          type="button"
          aria-label="Vider la saisie"
          disabled={desactive || saisie === ''}
          onClick={() => setSaisie('')}
          className="touche flex min-h-12 items-center justify-center rounded-xl text-craie/80"
        >
          <Eraser aria-hidden="true" className="size-5" />
        </button>
      </div>

      {sortie ? (
        <div className="flex animate-monter flex-col gap-1.5">
          <p className="text-center font-score text-sm uppercase tracking-widest text-vert-cible">
            Sortie ! Combien de fléchettes ?
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((nombre) => (
              <button
                key={nombre}
                type="button"
                disabled={desactive}
                onClick={() => valider(nombre)}
                className="laiton-poli chiffres min-h-12 rounded-xl text-xl font-bold disabled:opacity-40"
              >
                {nombre}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={desactive || !valide}
          onClick={() => valider(3)}
          className={[
            'laiton-poli flex min-h-14 items-center justify-center gap-2 rounded-xl',
            'font-score text-base font-bold uppercase tracking-widest',
            'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
          ].join(' ')}
        >
          <Check aria-hidden="true" className="size-5" />
          Valider
        </button>
      )}

      {/* La rangée du pouce, identique à celle du pavé fléchette par fléchette. */}
      <div className="grid grid-cols-[1fr_3.5rem] gap-1.5">
        <button
          type="button"
          disabled={desactive || !peutAnnuler}
          onClick={onAnnuler}
          className={[
            'touche flex min-h-14 items-center justify-center gap-2 rounded-xl',
            'border-chene font-score text-sm font-bold uppercase tracking-widest text-craie',
          ].join(' ')}
        >
          <Undo2 aria-hidden="true" className="size-4" />
          Annuler
        </button>

        <button
          type="button"
          aria-label="Saisie rapide"
          aria-pressed={rapide}
          onClick={onRapide}
          className={[
            'flex min-h-14 items-center justify-center rounded-xl',
            rapide ? 'laiton-plat' : 'touche text-craie/75',
          ].join(' ')}
        >
          <Zap aria-hidden="true" className="size-5" />
        </button>
      </div>
    </section>
  )
}
