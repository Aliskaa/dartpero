import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import { X01Config, type X01ConfigInput } from '@/core/domain/games/x01/config'
import { FakeAnnouncer, fakeDependencies, fakeServices } from '../fakes'
import { flechette } from './gestes'
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

const partieSonore = async () => {
  const dependencies = fakeDependencies()
  const voix = new FakeAnnouncer()
  services = createServices({
    ...dependencies,
    devices: {
      ...dependencies.devices,
      announcer: voix,
    },
  })

  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create(),
  })
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })
  return voix
}

describe('Écran de match', () => {
  it('suit le score à chaque fléchette, puis enregistre la volée complète', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await flechette(utilisateur, '20', 'Triple')

    expect(scoreDe('Kevin')).toHaveTextContent('441')

    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('321'))
    await waitFor(() => expect(scoreDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

  it('repasse en simple après chaque fléchette, sans laisser le triple armé', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await flechette(utilisateur, '20', 'Triple') // T20 → 441
    await flechette(utilisateur, '20') // le triple est retombé : S20 → 421

    expect(scoreDe('Kevin')).toHaveTextContent('421')
    expect(screen.getByRole('button', { name: 'Simple' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('compte le bullseye comme un double 25, et interdit le triple bull', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await flechette(utilisateur, 'Bulle', 'Double') // bullseye → 451
    expect(scoreDe('Kevin')).toHaveTextContent('451')

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    expect(screen.getByRole('button', { name: 'Bulle' })).toBeDisabled()
  })

  it('annule la volée entière sur un bust et rend la main', async () => {
    const utilisateur = userEvent.setup()
    await partie({ startingScore: 40 })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))

    await flechette(utilisateur, '20', 'Triple') // 40 - 60 < 0

    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('40'))
    expect(await screen.findByText(/bust/i)).toBeInTheDocument()
  })

  it('retire la dernière fléchette saisie avant de toucher aux volées enregistrées', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await flechette(utilisateur, '20')
    expect(scoreDe('Kevin')).toHaveTextContent('481')

    await utilisateur.click(screen.getByRole('button', { name: /annuler/i }))
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
  })

  it('écrit sur le bouton ce que l’annulation va défaire', async () => {
    const utilisateur = userEvent.setup()
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()

    await flechette(utilisateur, '20', 'Triple')
    const touche = screen.getByRole('button', { name: 'Annuler T20 de Kevin' })
    expect(touche).toBeEnabled()
    expect(touche).toHaveTextContent('Annuler T20')
    expect(touche).not.toHaveTextContent('Kevin')

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '20')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Annuler S20 de Kevin' })).toBeEnabled(),
    )
  })

  it('annonce le score PUIS le joueur suivant, en une seule phrase', async () => {
    const utilisateur = userEvent.setup()
    const voix = await partieSonore()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')

    await waitFor(() => expect(voix.textes).toEqual(['180. À toi, Julien']))
    expect(voix.annonces[0]).toEqual([
      { texte: '180', langue: 'fr-FR' },
      { texte: '. À toi, Julien', langue: 'fr-FR' },
    ])
  })

  it('affiche la sortie conseillée dès que le reste le permet', async () => {
    await partie({ startingScore: 40 })

    expect(await screen.findByText(/D20/)).toBeInTheDocument()
  })

  it('annonce « pas de finish » sur un bogey number plutôt qu’une route bidon', async () => {
    await partie({ startingScore: 169 })

    expect(await screen.findByText('Pas de finish')).toBeInTheDocument()
  })

  // ⚠️ La saisie rapide a été retirée du projet après usage réel (voir CLAUDE.md).
  it('n’offre plus de bascule vers une saisie rapide', async () => {
    await partie()
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))

    expect(screen.queryByRole('button', { name: /rapide/i })).not.toBeInTheDocument()
  })
})
