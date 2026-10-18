import { useCallback, useEffect, useRef, useState } from 'react'
import { useServices } from '../providers/ServicesProvider'

/** Durée pendant laquelle « Annuler » refuse de défaire une volée enregistrée. */
export const PAUSE_ANNULATION_MS = 1000

/**
 * La pause qui suit le retrait de la **dernière** fléchette d'un joueur — en
 * cours de saisie, ou d'une volée rouverte qui n'en comptait plus qu'une (lot
 * `annulation-volee`).
 *
 * Un double appui réflexe sur « Annuler T20 » retirait la fléchette, puis
 * rouvrait la volée d'un autre joueur (ou défaisait une manche gagnée). Pendant
 * `PAUSE_ANNULATION_MS`, le bouton refuse donc de toucher à une volée enregistrée.
 *
 * - `ecoulee()` fait **autorité** : elle compare `services.clock` à l'instant
 *   du retrait, et ne dépend pas du minuteur (onglet en arrière-plan : c'est
 *   l'horloge qui tranche).
 * - Le minuteur ne sert qu'à l'affichage : il repasse `enPause` à `false` pour
 *   que le bouton se réactive à l'écran.
 */
export const usePauseAnnulation = () => {
  const { clock } = useServices()
  const instant = useRef<number | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [enPause, setEnPause] = useState(false)

  useEffect(
    () => () => {
      if (minuteur.current !== null) clearTimeout(minuteur.current)
    },
    [],
  )

  const armer = useCallback(() => {
    instant.current = clock.now()
    setEnPause(true)
    if (minuteur.current !== null) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => {
      minuteur.current = null
      setEnPause(false)
    }, PAUSE_ANNULATION_MS)
  }, [clock])

  const ecoulee = useCallback(
    () => instant.current === null || clock.now() - instant.current >= PAUSE_ANNULATION_MS,
    [clock],
  )

  return { enPause, armer, ecoulee }
}
