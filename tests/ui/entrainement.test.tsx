import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { FakeAnnouncer, fakeDependencies, fakeServices } from '../fakes'
import { flechette } from './gestes'
import { renderWithServices } from './renderWithServices'

/**
 * Des services dont le porte-voix note ce qu'on lui demande de dire — c'est
 * tout l'intérêt d'avoir mis l'annonce derrière un port : on la teste sans
 * navigateur ni synthèse vocale.
 */
const avecVoix = () => {
  const announcer = new FakeAnnouncer()

  const base = fakeDependencies()
  return {
    announcer,
    services: createServices({ ...base, devices: { ...base.devices, announcer } }),
  }
}

const seance = async (services: Services, rounds = 2) => {
  const kevin = await services.managePlayers.create('Kevin')
  const matchId = await services.playCheckoutPractice.start({
    playerId: kevin.id,
    config: CheckoutPracticeConfig.create({ rounds }),
  })
  return { kevin, matchId }
}

describe('Entraînement au checkout — écran', () => {
  it('affiche la cible tirée et la fait descendre à chaque fléchette', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await seance(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    const reste = await screen.findByLabelText('Reste pour le checkout')
    const cible = Number(reste.textContent)
    expect(cible).toBeGreaterThanOrEqual(41)

    // Un simple 1 : assez petit pour ne jamais buster, quel que soit le tirage.
    await flechette(utilisateur, '1')
    await waitFor(() => expect(Number(reste.textContent)).toBe(cible - 1))
  })

  it('propose une route de sortie', async () => {
    const { services } = fakeServices()
    const { matchId } = await seance(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    expect(await screen.findByText('Route')).toBeInTheDocument()
  })

  it('enchaîne les manches puis mène au résumé', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await seance(services, 2)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Reste pour le checkout')

    // Deux manches ratées : trois fléchettes chacune, aucune sortie.
    for (const _ of [0, 1]) {
      for (const __ of [0, 1, 2]) await flechette(utilisateur, '1')
    }

    expect(await screen.findByText(/séance terminée/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Taux de réussite')).toHaveTextContent('0')
  })

  it('n’a pas de mode rapide : il n’aurait rien à accélérer', async () => {
    const { services } = fakeServices()
    const { matchId } = await seance(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Reste pour le checkout')

    expect(screen.queryByRole('button', { name: /rapide/i })).toBeNull()
    // Mais bien le pavé fléchette par fléchette, avec ses multiplicateurs.
    expect(screen.getByRole('button', { name: 'Triple' })).toBeInTheDocument()
  })

  it('se lance depuis l’accueil, par la carte Entraînement de « Nouvelle partie »', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')

    renderWithServices(<App />, { services, route: '/' })

    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^Entraînement/ }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Kevin/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Reste pour le checkout')).toBeInTheDocument()
  })
})

describe('Annonce vocale', () => {
  it('annonce le score, le bust et la sortie au X01', async () => {
    const utilisateur = userEvent.setup()
    const { announcer, services } = avecVoix()

    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ startingScore: 60, legsToWin: 1 }),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Score restant de Kevin')

    // 20 · 20 · 20 = 60, mais sans double : bust.
    for (const _ of [0, 1, 2]) await flechette(utilisateur, '20')

    await waitFor(() =>
      expect(announcer.annonces).toContainEqual([{ texte: 'Bust', langue: 'en-US' }]),
    )
  })

  /** Les nombres partent en chiffres : la voix française les lit très bien. */
  it('annonce le total en chiffres, pas en lettres', async () => {
    const utilisateur = userEvent.setup()
    const { announcer, services } = avecVoix()

    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Score restant de Kevin')

    for (const _ of [0, 1, 2]) await flechette(utilisateur, '20', 'Triple')

    await waitFor(() =>
      expect(announcer.annonces).toContainEqual([{ texte: '180', langue: 'fr-FR' }]),
    )
  })

  it('se tait quand l’utilisateur l’a coupée dans les réglages', async () => {
    const utilisateur = userEvent.setup()
    const { announcer, services } = avecVoix()

    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })

    // On coupe la voix depuis l'écran de réglages…
    const reglages = renderWithServices(<App />, { services, route: '/reglages' })
    await utilisateur.click(await screen.findByRole('button', { name: /annoncer les volées/i }))
    reglages.unmount()

    // … et plus rien n'est annoncé en partie.
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Score restant de Kevin')
    await flechette(utilisateur, '20', 'Triple')

    await waitFor(() =>
      expect(screen.getByLabelText('Score restant de Kevin')).toHaveTextContent('441'),
    )
    expect(announcer.annonces).toEqual([])
  })

  it('laisse essayer la voix depuis les réglages', async () => {
    const utilisateur = userEvent.setup()
    const { announcer, services } = avecVoix()

    renderWithServices(<App />, { services, route: '/reglages' })
    await utilisateur.click(await screen.findByRole('button', { name: /essayer la voix/i }))

    expect(announcer.annonces).toEqual([[{ texte: 'Cent quatre-vingts', langue: 'fr-FR' }]])
  })
})
