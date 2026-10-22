import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

const enObjet = (etat: unknown): Record<string, unknown> =>
  typeof etat === 'object' && etat !== null ? (etat as Record<string, unknown>) : {}

/** Une modale que le retour du téléphone referme : une entrée d'historique sur la même URL (`location.state[cle]`).
 * ⚠️ Garde « en vol » contre le double recul ; fermer par `navigate(-1)`, `ouvrir` dans un clic, jamais `<Link>`. */
export const useModaleAuRetour = <T extends string>(
  cle: string,
  valeurs: readonly T[],
): {
  readonly ouverte: T | null
  readonly ouvrir: (valeur: T) => void
  readonly fermer: () => void
} => {
  const location = useLocation()
  const navigate = useNavigate()
  const enVol = useRef(false)

  const brut = enObjet(location.state)[cle]
  const ouverte =
    typeof brut === 'string' && (valeurs as readonly string[]).includes(brut) ? (brut as T) : null

  // biome-ignore lint/correctness/useExhaustiveDependencies: l'effet doit se rejouer à chaque nouvelle entrée d'historique, que rien d'autre dans son corps ne lit
  useEffect(() => {
    enVol.current = false
  }, [location.key])

  const ouvrir = useCallback(
    (valeur: T) => {
      if (ouverte !== null || enVol.current) return
      enVol.current = true
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { state: { ...enObjet(location.state), [cle]: valeur } },
      )
    },
    [ouverte, navigate, location, cle],
  )

  const fermer = useCallback(() => {
    if (ouverte === null || enVol.current) return
    enVol.current = true
    navigate(-1)
  }, [ouverte, navigate])

  return { ouverte, ouvrir, fermer }
}
