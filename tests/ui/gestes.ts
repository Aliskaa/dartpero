import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

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
