import { useEffect, useState } from 'react'
import type { QrMatrix } from '@/core/application/ports/driven/QrEncoder'
import { ERREUR_CODE_QR, ETIQUETTE_CODE_QR } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { SpinnerLigne } from './Etats'

/** La zone de silence, en modules, de chaque côté (norme QR : 4 au moins). */
const SILENCE = 4

const chemin = (matrice: QrMatrix): string => {
  let trace = ''
  matrice.modules.forEach((ligne, y) => {
    ligne.forEach((sombre, x) => {
      if (sombre) trace += `M${x + SILENCE} ${y + SILENCE}h1v1h-1z`
    })
  })
  return trace
}

type Props = {
  /** Le jeton à porter ; le QR n'en est qu'une représentation. */
  readonly texte: string
}

/** Le QR, toujours sombre sur clair avec sa zone de silence, 311 px au plus. Encodé par `devices.qrEncoder`. */
export const CodeQr = ({ texte }: Props) => {
  const { devices } = useServices()
  const [rendu, setRendu] = useState<{
    readonly texte: string
    readonly matrice: QrMatrix | null
  } | null>(null)

  useEffect(() => {
    let actif = true
    devices.qrEncoder.encode(texte).then(
      (matrice) => {
        if (actif) setRendu({ texte, matrice })
      },
      () => {
        if (actif) setRendu({ texte, matrice: null })
      },
    )
    return () => {
      actif = false
    }
  }, [devices, texte])

  const courant = rendu?.texte === texte ? rendu : null
  if (courant === null) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-77.75 items-center justify-center">
        <SpinnerLigne />
      </div>
    )
  }
  if (courant.matrice === null) return <p className="text-sm text-craie-2">{ERREUR_CODE_QR}</p>

  const cote = courant.matrice.size + 2 * SILENCE
  return (
    <div role="img" aria-label={ETIQUETTE_CODE_QR} className="mx-auto w-full max-w-77.75">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${cote} ${cote}`}
        shapeRendering="crispEdges"
        className="block aspect-square w-full"
      >
        <rect width={cote} height={cote} className="fill-qr-fond" />
        <path d={chemin(courant.matrice)} className="fill-qr-modules" />
      </svg>
    </div>
  )
}
