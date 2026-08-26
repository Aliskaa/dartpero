import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const avecJoueurs = async (...noms: readonly string[]) => {
  const { services } = fakeServices()
  for (const nom of noms) await services.managePlayers.create(nom)
  return services
}

/** Ancré au début : sinon « Faire jouer Kevin plus tôt » répondrait aussi. */
const joueur = (nom: string) => screen.getByRole('button', { name: new RegExp(`^${nom}`, 'i') })

const ouvrir = (services: Services) =>
  renderWithServices(<App />, { services, route: '/nouvelle-partie' })

describe('Création de partie — ordre de passage', () => {
  /**
   * L'ordre des taps était déjà l'ordre de passage, mais rien ne le disait et
   * il fallait tout décocher pour intervertir deux joueurs. Or qui commence
   * n'est jamais neutre.
   */
  it('nomme celui qui commence et laisse réordonner les joueurs', async () => {
    const utilisateur = userEvent.setup()
    ouvrir(await avecJoueurs('Kevin', 'Julien', 'Paul'))

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))
    await utilisateur.click(joueur('Paul'))

    expect(joueur('Kevin')).toHaveTextContent('n°1')
    expect(joueur('Julien')).toHaveTextContent('n°2')
    expect(screen.getByText(/ordre de passage/i)).toHaveTextContent('Kevin commence')

    // Julien passe devant : un tap, sans rien décocher.
    await utilisateur.click(screen.getByRole('button', { name: 'Faire jouer Julien plus tôt' }))

    expect(joueur('Julien')).toHaveTextContent('n°1')
    expect(joueur('Kevin')).toHaveTextContent('n°2')
    expect(screen.getByText(/ordre de passage/i)).toHaveTextContent('Julien commence')
  })

  it('ne propose pas de trier tant qu’il n’y a qu’un joueur', async () => {
    const utilisateur = userEvent.setup()
    ouvrir(await avecJoueurs('Kevin'))

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))

    expect(screen.queryByRole('button', { name: /plus tôt/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/ordre de passage/i)).not.toBeInTheDocument()
  })
})

describe('Création de partie — réglages retenus', () => {
  /**
   * Entre potes on enchaîne les parties avec la même formule. Tout était en
   * `useState` à valeurs codées en dur : il fallait tout re-choisir à chaque
   * fois, alors que le port `Preferences` servait déjà à la voix.
   */
  it('rouvre sur la dernière formule jouée, joueurs compris', async () => {
    const utilisateur = userEvent.setup()
    const services = await avecJoueurs('Kevin', 'Julien')

    const premiere = ouvrir(services)
    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))
    await utilisateur.click(screen.getByRole('button', { name: '301' }))
    await utilisateur.click(screen.getByRole('button', { name: '5' }))
    premiere.unmount()

    ouvrir(services)

    await waitFor(() => expect(joueur('Kevin')).toHaveAttribute('aria-pressed', 'true'))
    expect(joueur('Julien')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '301' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')
  })

  /**
   * ⚠️ Un profil supprimé depuis ne doit pas rester coché en fantôme : le
   * lancement échouerait sur un joueur inconnu, sans que rien ne l'explique.
   */
  it('oublie un joueur supprimé depuis la dernière partie', async () => {
    const utilisateur = userEvent.setup()
    const services = await avecJoueurs('Kevin', 'Julien')

    const premiere = ouvrir(services)
    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))
    premiere.unmount()

    const julien = (await services.managePlayers.listAll()).find((p) => p.name === 'Julien')
    if (julien) await services.managePlayers.remove(julien.id)

    ouvrir(services)

    await waitFor(() => expect(joueur('Kevin')).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.queryByRole('button', { name: /^julien/i })).not.toBeInTheDocument()
    // Kevin garde son rang : la sélection s'est réparée, elle ne s'est pas vidée.
    expect(joueur('Kevin')).toHaveTextContent('n°1')
  })
})
