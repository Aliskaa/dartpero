import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

const enObjet = (etat: unknown): Record<string, unknown> =>
  typeof etat === 'object' && etat !== null ? (etat as Record<string, unknown>) : {}

/**
 * Une modale que le **retour du téléphone** referme sans quitter l'écran
 * (lot `statistiques-podium`, Révision 1).
 *
 * L'ouverture empile une entrée d'historique sur **la même URL**, marquée dans
 * `location.state[cle]` : le retour la dépile, la marque disparaît, la modale
 * se ferme, et l'écran — jamais démonté — garde période, bascules et cible.
 *
 * ⚠️ Les pièges, tous tenus ici :
 * 1. Double recul (✕ puis `close` du navigateur, double appui) : une garde
 *    « en vol » (`useRef`, pas `location`, qu'une transition peut différer),
 *    remise à zéro quand `location.key` change.
 * 2. Entrée orpheline : on ferme **toujours** par `navigate(-1)`, jamais en
 *    remplaçant l'entrée ni en remettant un état local à faux.
 * 3. `ouvrir` **seulement dans un gestionnaire de clic** : depuis un effet, il
 *    serait doublé sous `StrictMode` et sauté par Chrome sans geste.
 * 4. `navigate`, jamais `<Link>` vers l'emplacement courant (il remplace).
 * 5. Jamais `window.history` : React Router perdrait son index.
 *
 * L'état relu est validé contre la liste fermée `valeurs` : il ne fait que
 * choisir une modale, il n'est jamais affiché. Il survit à un rechargement :
 * la modale se rouvre, et le retour la ferme (R1-Q9).
 */
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
