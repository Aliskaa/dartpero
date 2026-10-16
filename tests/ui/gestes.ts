import { act, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { type Location, type NavigateFunction, useLocation, useNavigate } from 'react-router'

/**
 * Saisit une fléchette comme le ferait un joueur.
 *
 * Le multiplicateur est **momentané** : il retombe sur Simple après chaque
 * fléchette. Il faut donc le re-sélectionner à chaque triple, et ce helper
 * existe précisément pour que les tests le disent une fois plutôt que dix.
 */
export const flechette = async (
  utilisateur: UserEvent,
  cible: string,
  multiplicateur?: 'Double' | 'Triple',
) => {
  if (multiplicateur) {
    await utilisateur.click(screen.getByRole('button', { name: multiplicateur }))
  }
  await utilisateur.click(screen.getByRole('button', { name: cible }))
}

let naviguer: NavigateFunction | null = null
let location: Location | null = null

/**
 * Une sonde posée à côté de l'écran testé, dans le même routeur. Elle ne rend
 * rien : elle garde seulement la main sur l'historique, pour que
 * `retourTelephone` puisse reculer comme le ferait le bouton du téléphone, et
 * la dernière location vue, pour `locationCourante`.
 */
export const SondeHistorique = (): null => {
  naviguer = useNavigate()
  location = useLocation()
  return null
}

/**
 * Oublie la sonde du test précédent (appelé par `tests/setup.ts` après chaque
 * test) : un test qui l'aurait oubliée échoue au lieu de lire une vieille location.
 */
export const oublierSonde = (): void => {
  naviguer = null
  location = null
}

/** Le geste « suivant » du navigateur (ou le glissé avant d'iOS) : une entrée en avant. */
export const avancerTelephone = async (): Promise<void> => {
  const avancer = naviguer
  if (!avancer) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  await act(async () => {
    await avancer(1)
  })
}

/** L'URL et l'état d'historique courants, tels que le routeur les voit. */
export const locationCourante = (): Location => {
  if (!location) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  return location
}

/**
 * Le bouton retour du téléphone : un recul d'une entrée dans l'historique
 * (POP), sans passer par aucun bouton de l'écran.
 */
export const retourTelephone = async (): Promise<void> => {
  const reculer = naviguer
  if (!reculer) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  await act(async () => {
    await reculer(-1)
  })
}
