import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { X01Config, type X01ConfigInput } from '@/core/domain/entities/Match'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

let services: Services

const partie = async (config: X01ConfigInput = {}) => {
  services = fakeServices().services
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create(config),
  })
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })
  return { kevin, julien }
}

const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)

describe('Écran de match', () => {
  beforeEach(() => {
    // Chaque test repart d'une base vierge : les services sont recréés.
  })

  it('suit le score à chaque fléchette, puis enregistre la volée complète', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    await utilisateur.click(screen.getByRole('button', { name: '20' }))

    // Le tableau réagit AVANT que la volée ne soit enregistrée.
    expect(scoreDe('Kevin')).toHaveTextContent('441')

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    await utilisateur.click(screen.getByRole('button', { name: '20' }))

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('321'))
    // La main est passée : c'est Julien qui a le halo.
    await waitFor(() => expect(scoreDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

  it('annule la volée entière sur un bust et rend la main', async () => {
    const utilisateur = userEvent.setup()
    await partie({ startingScore: 40 })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    await utilisateur.click(screen.getByRole('button', { name: '20' })) // 40 - 60 < 0

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    expect(await screen.findByText(/bust/i)).toBeInTheDocument()
  })

  it('retire la dernière fléchette saisie avant de toucher aux volées enregistrées', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(scoreDe('Kevin')).toHaveTextContent('481')

    await utilisateur.click(screen.getByRole('button', { name: /annuler/i }))
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
  })

  it('affiche la sortie conseillée dès que le reste le permet', async () => {
    await partie({ startingScore: 40 })

    expect(await screen.findByText(/D20/)).toBeInTheDocument()
  })

  it('annonce « pas de finish » sur un bogey number plutôt qu’une route bidon', async () => {
    await partie({ startingScore: 169 })

    expect(await screen.findByText('Pas de finish')).toBeInTheDocument()
  })

  it('enregistre un score de volée en mode rapide', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await utilisateur.click(screen.getByRole('button', { name: /rapide/i }))
    await utilisateur.click(screen.getByRole('button', { name: '100' }))
    await utilisateur.click(screen.getByRole('button', { name: /valider/i }))

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('401'))
  })

  it('refuse un score de volée impossible', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await utilisateur.click(screen.getByRole('button', { name: /rapide/i }))
    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    await utilisateur.click(screen.getByRole('button', { name: '7' }))
    await utilisateur.click(screen.getByRole('button', { name: '9' }))
    await utilisateur.click(screen.getByRole('button', { name: /valider/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible/i)
    expect(scoreDe('Kevin')).toHaveTextContent('501')
  })
})
