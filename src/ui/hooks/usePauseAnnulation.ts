import { useCallback, useEffect, useRef, useState } from 'react'
import { useServices } from '../providers/ServicesProvider'

/** Durée pendant laquelle « Annuler » refuse de défaire une volée enregistrée. */
export const PAUSE_ANNULATION_MS = 1000

/**
 * La pause qui suit le retrait de la dernière fléchette d'un joueur : un double appui réflexe rouvrirait la volée d'un autre.
 * ⚠️ `ecoulee()` fait autorité (horloge), le minuteur ne sert qu'à réactiver le bouton à l'écran.
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
