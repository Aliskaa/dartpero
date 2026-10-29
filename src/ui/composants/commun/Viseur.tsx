import type { Ref } from 'react'
import { ETIQUETTE_VISEUR } from '@/ui/labels'

type Props = {
  /** La vidéo que le lecteur de QR alimente ; le flux reste dans l'adapter. */
  readonly ref: Ref<HTMLVideoElement>
  /** Monté avant le clic (la caméra s'ouvre dans le geste), montré seulement pendant la lecture. */
  readonly visible: boolean
}

const COINS = [
  'left-10 top-10 border-l-3 border-t-3',
  'right-10 top-10 border-r-3 border-t-3',
  'bottom-10 left-10 border-b-3 border-l-3',
  'bottom-10 right-10 border-b-3 border-r-3',
] as const

/** L'image de la caméra, encadrée de quatre coins de laiton. ⚠️ `playsInline` et `muted` : iOS l'exige. */
export const Viseur = ({ ref, visible }: Props) => (
  <div className={visible ? 'relative h-80 overflow-hidden bg-feutre-nuit' : 'hidden'}>
    <video
      ref={ref}
      playsInline
      muted
      aria-label={ETIQUETTE_VISEUR}
      className="size-full object-cover"
    />
    {COINS.map((coin) => (
      <span
        key={coin}
        aria-hidden="true"
        className={`pointer-events-none absolute size-12 border-laiton ${coin}`}
      />
    ))}
  </div>
)
