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
    await utilisateur.click(screen.getByRole('button', { name: '3' }))
    premiere.unmount()

    ouvrir(services)

    await waitFor(() => expect(joueur('Kevin')).toHaveAttribute('aria-pressed', 'true'))
    expect(joueur('Julien')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '301' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true')
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

describe('Création de partie — ordre aléatoire', () => {
  /**
   * Le tirage évite la discussion « c'est qui qui commence », qui revient à
   * chaque partie. Il n'apparaît qu'à partir de deux joueurs : tirer l'ordre
   * d'un joueur seul n'aurait aucun sens.
   */
  it('n’apparaît qu’à partir de deux joueurs', async () => {
    const utilisateur = userEvent.setup()
    ouvrir(await avecJoueurs('Kevin', 'Julien'))

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    expect(screen.queryByRole('button', { name: /ordre aléatoire/i })).not.toBeInTheDocument()

    await utilisateur.click(joueur('Julien'))
    expect(screen.getByRole('button', { name: /ordre aléatoire/i })).toBeInTheDocument()
  })

  /**
   * ⚠️ Deux flèches qui réordonnent une liste qui sera rebattue au lancement,
   * ce n'est pas un réglage : c'est un piège. Et on ne peut pas nommer celui
   * qui commence, le sort n'étant pas encore tombé.
   */
  it('retire les flèches d’ordre et ne nomme plus celui qui commence', async () => {
    const utilisateur = userEvent.setup()
    ouvrir(await avecJoueurs('Kevin', 'Julien'))

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))

    expect(screen.getByText(/ordre de passage/i)).toHaveTextContent('Kevin commence')
    expect(screen.getByRole('button', { name: /faire jouer Julien plus tôt/i })).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: /ordre aléatoire/i }))

    expect(screen.getByText(/ordre de passage/i)).toHaveTextContent('tiré au sort')
    expect(screen.queryByText(/Kevin commence/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /faire jouer Julien plus tôt/i }),
    ).not.toBeInTheDocument()
  })

  /**
   * ⚠️ Vu à l'écran, pas en test : les badges « n°1 / n°2 » restaient affichés
   * sous tirage. Ils annonçaient donc un rang qui ne serait pas celui joué —
   * la même faute que les flèches d'ordre, en beaucoup plus discrète.
   */
  it('retire les numéros d’ordre, qui annonceraient un rang faux', async () => {
    const utilisateur = userEvent.setup()
    ouvrir(await avecJoueurs('Kevin', 'Julien'))

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))
    expect(joueur('Kevin')).toHaveTextContent('n°1')

    await utilisateur.click(screen.getByRole('button', { name: /ordre aléatoire/i }))

    expect(joueur('Kevin')).not.toHaveTextContent('n°1')
    expect(joueur('Julien')).not.toHaveTextContent('n°2')
  })

  it('lance vraiment la partie sur un ordre rebattu', async () => {
    const utilisateur = userEvent.setup()
    const services = await avecJoueurs('Kevin', 'Julien', 'Paul')
    ouvrir(services)

    await waitFor(() => expect(joueur('Kevin')).toBeInTheDocument())
    await utilisateur.click(joueur('Kevin'))
    await utilisateur.click(joueur('Julien'))
    await utilisateur.click(joueur('Paul'))
    await utilisateur.click(screen.getByRole('button', { name: /ordre aléatoire/i }))
    await utilisateur.click(screen.getByRole('button', { name: /^commencer/i }))

    const partie = (await services.getMatchHistory.execute())[0]
    if (!partie) throw new Error('aucune partie lancée')

    const noms = partie.players.map((joueur) => joueur.name)
    expect([...noms].sort()).toEqual(['Julien', 'Kevin', 'Paul'])
    // L'aléa des fakes est déterministe : ce n'est pas l'ordre des taps.
    expect(noms).not.toEqual(['Kevin', 'Julien', 'Paul'])
  })
})
