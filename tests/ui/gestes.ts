import { act, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { type Location, type NavigateFunction, useLocation, useNavigate } from 'react-router'

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

export const validerSortie = async (utilisateur: UserEvent) => {
  await utilisateur.click(await screen.findByRole('button', { name: 'Valider la sortie' }))
}

export const flechetteDeSortie = async (
  utilisateur: UserEvent,
  cible: string,
  multiplicateur?: 'Double' | 'Triple',
) => {
  await flechette(utilisateur, cible, multiplicateur)
  await validerSortie(utilisateur)
}

let naviguer: NavigateFunction | null = null
let location: Location | null = null

export const SondeHistorique = (): null => {
  naviguer = useNavigate()
  location = useLocation()
  return null
}

export const oublierSonde = (): void => {
  naviguer = null
  location = null
}

export const avancerTelephone = async (): Promise<void> => {
  const avancer = naviguer
  if (!avancer) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  await act(async () => {
    await avancer(1)
  })
}

export const locationCourante = (): Location => {
  if (!location) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  return location
}

export const retourTelephone = async (): Promise<void> => {
  const reculer = naviguer
  if (!reculer) throw new Error('SondeHistorique absente : rendre avec renderWithServices')
  await act(async () => {
    await reculer(-1)
  })
}
