import { useState } from 'react'

const RACCOURCIS = [26, 41, 45, 60, 85, 100, 140, 180] as const
const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const

type Props = {
  readonly reste: number
  readonly onScore: (total: number, dartsUsed: number) => void
  readonly desactive: boolean
}

/**
 * ZONE SAISIE — mode rapide : un score de volée plutôt que trois fléchettes.
 *
 * Quand le score annoncé clôt le leg, on demande **combien de fléchettes** ont
 * servi : c'est la seule information que le total ne porte pas, et elle change
 * la moyenne comme le « meilleur leg ».
 */
export const PaveRapide = ({ reste, onScore, desactive }: Props) => {
  const [saisie, setSaisie] = useState('')

  const total = saisie === '' ? null : Number(saisie)
  const valide = total !== null && total >= 0 && total <= 180
  const sortie = valide && total === reste

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
    <section aria-label="Saisie rapide" className="flex flex-col gap-2">
      <output
        aria-label="Score de la volée"
        className="ardoise-craie chiffres flex min-h-14 items-center justify-center rounded-xl text-4xl font-bold text-craie-vive"
      >
        {saisie === '' ? <span className="text-craie/30">—</span> : saisie}
      </output>

      <div className="grid grid-cols-4 gap-2">
        {RACCOURCIS.map((score) => (
          <button
            key={score}
            type="button"
            disabled={desactive}
            onClick={() => setSaisie(String(score))}
            className="chiffres ardoise-craie min-h-12 rounded-xl text-base font-bold text-craie disabled:opacity-40 active:bg-laiton/25"
          >
            {score}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TOUCHES.map((touche) => (
          <button
            key={touche}
            type="button"
            disabled={desactive}
            onClick={() => taper(touche)}
            className="chiffres ardoise-craie min-h-12 rounded-xl text-xl font-bold text-craie-vive disabled:opacity-40 active:bg-laiton/25"
          >
            {touche}
          </button>
        ))}
        <button
          type="button"
          disabled={desactive || saisie === ''}
          onClick={() => setSaisie(saisie.slice(0, -1))}
          className="ardoise-craie min-h-12 rounded-xl font-score text-sm uppercase tracking-widest text-craie/80 disabled:opacity-40"
        >
          Effacer
        </button>
        <button
          type="button"
          disabled={desactive || saisie === ''}
          onClick={() => setSaisie('')}
          className="ardoise-craie min-h-12 rounded-xl font-score text-sm uppercase tracking-widest text-craie/80 disabled:opacity-40"
        >
          Vider
        </button>
      </div>

      {sortie ? (
        <div className="flex flex-col gap-2">
          <p className="text-center font-score text-sm uppercase tracking-widest text-vert-cible">
            Sortie ! Combien de fléchettes ?
          </p>
          <div className="grid grid-cols-3 gap-2">
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
          className="laiton-poli min-h-12 rounded-xl font-score text-base font-bold uppercase tracking-widest disabled:opacity-40"
        >
          Valider
        </button>
      )}
    </section>
  )
}
