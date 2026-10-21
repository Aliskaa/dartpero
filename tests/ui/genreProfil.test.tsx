import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

/**
 * Lot `killer` : le genre d'un profil, côté écran (planche `genre-profil`,
 * piste B). Il sert seulement à accorder « éliminé / éliminée » au Killer ; il
 * se choisit à la création depuis l'étape 2 (ligne repliée) et à la
 * modification de la carte, jamais au repos.
 */

type Utilisateur = ReturnType<typeof userEvent.setup>

const profil = async (services: Services, nom: string) => {
  const trouve = (await services.managePlayers.listAll()).find((joueur) => joueur.name === nom)
  if (!trouve) throw new Error(`profil ${nom} absent`)
  return trouve
}

const ouvrirBoite = async (utilisateur: Utilisateur) => {
  await utilisateur.click(await screen.findByRole('button', { name: 'Ajouter un joueur' }))
  await utilisateur.click(screen.getByRole('button', { name: 'Nouveau joueur' }))
  return within(screen.getByRole('dialog', { name: 'Nouveau joueur' }))
}

const TROIS_MOTS = /Masculin|Féminin|Non précisé/

describe('Genre — la boîte « Nouveau joueur »', () => {
  it('montre une ligne repliée « Non précisé · Modifier », sans les trois cases', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    const boite = await ouvrirBoite(utilisateur)

    const ligne = boite.getByRole('button', { name: 'Genre Non précisé' })
    expect(ligne).toHaveAttribute('aria-expanded', 'false')
    expect(ligne).toHaveTextContent('Modifier')
    expect(boite.queryByRole('button', { name: 'Féminin' })).toBeNull()
  })

  it('créer sans y toucher : le profil n’a pas de genre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    const boite = await ouvrirBoite(utilisateur)

    await utilisateur.type(boite.getByLabelText('Pseudo'), 'Alex')
    await utilisateur.click(boite.getByRole('button', { name: 'Terminé' }))

    await waitFor(async () => expect(await services.managePlayers.listAll()).toHaveLength(1))
    expect('gender' in (await profil(services, 'Alex'))).toBe(false)
  })

  it('ouvrir, choisir « Féminin » : profil FEMININE après « Terminé » ; réinitialisé à la réouverture', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    let boite = await ouvrirBoite(utilisateur)

    await utilisateur.type(boite.getByLabelText('Pseudo'), 'Sarah')
    await utilisateur.click(boite.getByRole('button', { name: 'Genre Non précisé' }))
    const cases = within(boite.getByRole('group', { name: 'Genre' }))
    expect(cases.getByRole('button', { name: 'Non précisé' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await utilisateur.click(cases.getByRole('button', { name: 'Féminin' }))
    expect(cases.getByRole('button', { name: 'Féminin' })).toHaveAttribute('aria-pressed', 'true')
    // La ligne reste ouverte et dit la valeur choisie.
    const ligne = boite.getByRole('button', { name: 'Genre Féminin' })
    expect(ligne).toHaveAttribute('aria-expanded', 'true')
    expect(
      boite.getByText('Sert à accorder « éliminé / éliminée » dans le Killer. Facultatif.'),
    ).toBeInTheDocument()

    await utilisateur.click(boite.getByRole('button', { name: 'Terminé' }))
    await waitFor(async () => expect((await profil(services, 'Sarah')).gender).toBe('FEMININE'))

    // Réouverture : de nouveau « non précisé », replié.
    boite = await ouvrirBoite(utilisateur)
    const repliee = boite.getByRole('button', { name: 'Genre Non précisé' })
    expect(repliee).toHaveAttribute('aria-expanded', 'false')
    expect(boite.queryByRole('group', { name: 'Genre' })).toBeNull()
  })
})

describe('Genre — la carte du profil', () => {
  it('au repos, la carte ne montre pas le genre', async () => {
    const { services } = fakeServices()
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')
    renderWithServices(<App />, { services, route: '/joueurs' })

    const carte = (await screen.findByText('Sarah')).closest('li')
    expect(carte).not.toBeNull()
    expect(carte?.textContent).not.toMatch(TROIS_MOTS)
    expect(carte?.textContent).not.toMatch(/Genre/)
  })

  it('en édition : présélection, « Enregistrer » met à jour, rechargé avec un nouveau cache', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')
    const { unmount } = renderWithServices(<App />, { services, route: '/joueurs' })

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Sarah' }))
    const cases = within(screen.getByRole('group', { name: 'Genre' }))
    expect(cases.getByRole('button', { name: 'Féminin' })).toHaveAttribute('aria-pressed', 'true')

    await utilisateur.click(cases.getByRole('button', { name: 'Masculin' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(async () => expect((await profil(services, 'Sarah')).gender).toBe('MASCULINE'))

    // « Rechargement » : mêmes services, nouveau cache de requêtes.
    unmount()
    renderWithServices(<App />, {
      services,
      route: '/joueurs',
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    })
    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Sarah' }))
    expect(
      within(screen.getByRole('group', { name: 'Genre' })).getByRole('button', {
        name: 'Masculin',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('« Non précisé » puis « Enregistrer » retire le genre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')
    renderWithServices(<App />, { services, route: '/joueurs' })

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Sarah' }))
    await utilisateur.click(
      within(screen.getByRole('group', { name: 'Genre' })).getByRole('button', {
        name: 'Non précisé',
      }),
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(async () => expect('gender' in (await profil(services, 'Sarah'))).toBe(false))
  })

  it('✕ ne change rien, et la réouverture repart du genre enregistré', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')
    renderWithServices(<App />, { services, route: '/joueurs' })

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Sarah' }))
    await utilisateur.click(
      within(screen.getByRole('group', { name: 'Genre' })).getByRole('button', {
        name: 'Masculin',
      }),
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Annuler' }))
    expect((await profil(services, 'Sarah')).gender).toBe('FEMININE')

    await utilisateur.click(await screen.findByRole('button', { name: 'Modifier Sarah' }))
    expect(
      within(screen.getByRole('group', { name: 'Genre' })).getByRole('button', {
        name: 'Féminin',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('le champ en ligne de l’onglet Joueurs ne propose pas de genre', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/joueurs' })
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('group', { name: 'Genre' })).toBeNull()
    expect(screen.queryByText(TROIS_MOTS)).toBeNull()
  })
})
