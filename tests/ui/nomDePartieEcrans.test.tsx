import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import {
  createMemoryPreferences,
  type Preferences,
} from '@/core/application/ports/driven/Preferences'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { MatchId, type PlayerId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { fakeServices, SettableClock } from '../fakes'
import { lancer, ouverture } from '../use-cases/lancerPartie'
import { retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

const DIMANCHE_SOIR = new Date(2026, 9, 11, 21, 0).getTime()

const preferencesEspionnes = () => {
  const memoire = createMemoryPreferences()
  const ecrites: unknown[] = []
  const preferences: Preferences = {
    read: memoire.read,
    write: (cle, valeur) => {
      ecrites.push(valeur)
      memoire.write(cle, valeur)
    },
  }
  return { preferences, ecrites }
}

const base = async () => {
  const clock = new SettableClock(DIMANCHE_SOIR)
  const { preferences, ecrites } = preferencesEspionnes()
  const neuf = fakeServices({ clock })
  const { services, dependencies } = fakeServices({
    clock,
    devices: { ...neuf.dependencies.devices, preferences },
  })
  const kevin = (await services.managePlayers.create('Kevin')).id
  const julien = (await services.managePlayers.create('Julien')).id
  preferences.write('partie:joueurs', [kevin])
  ecrites.length = 0
  const joueurs = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]
  const deuxJoueurs = () => preferences.write('partie:joueurs', [kevin, julien])
  return { services, dependencies, ecrites, joueurs, clock, deuxJoueurs }
}

const MARDI_MATIN = new Date(2026, 9, 13, 9, 0).getTime()

const ouvrir = (services: Services, route = '/nouvelle-partie') =>
  renderWithServices(<App />, { services, route })

const champNom = () => screen.getByLabelText(/^Nom de la partie/)

const CARTE: Record<GameModeId, RegExp> = {
  X01: /^X01/,
  CRICKET: /^Cricket/,
  TOUR_DU_MONDE: /^Tour du monde/,
  KILLER: /^Killer/,
  CHECKOUT_PRACTICE: /^Entraînement/,
}

const commencer = async (utilisateur: ReturnType<typeof userEvent.setup>, mode: GameModeId) => {
  if (mode === 'KILLER') {
    await utilisateur.click(await screen.findByRole('button', { name: 'Continuer' }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
  }
  await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))
}

const derniere = async (services: Services) => {
  await waitFor(async () => expect(await services.getMatchHistory.execute()).toHaveLength(1))
  const [partie] = await services.getMatchHistory.execute()
  if (!partie) throw new Error('aucune partie lancée')
  return partie
}

describe('Nom de la partie — étape 1', () => {
  it('n’a plus de champ nom à l’étape 1', async () => {
    const { services } = await base()
    ouvrir(services)

    await screen.findByRole('link', { name: /^X01/ })
    expect(screen.queryByLabelText(/^Nom de la partie/)).toBeNull()
  })
})

describe('Nom de la partie — étape 2', () => {
  it('propose « Dimanche soir » un dimanche à 21 h, facultatif, sans prendre le focus', async () => {
    const { services } = await base()
    ouvrir(services, '/nouvelle-partie/x01')

    const champ = await screen.findByLabelText('Nom de la partie · facultatif')
    expect(champ).toHaveValue('Dimanche soir')
    expect(champ).not.toHaveFocus()
    expect(champ).not.toBeRequired()
  })

  it('limite la saisie à 30 caractères', async () => {
    const { services } = await base()
    ouvrir(services, '/nouvelle-partie/x01')

    expect(await screen.findByLabelText(/^Nom de la partie/)).toHaveAttribute('maxLength', '30')
  })

  it('montre la proposition en filigrane quand on vide le champ', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base()
    ouvrir(services, '/nouvelle-partie/x01')

    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    expect(champNom()).toHaveValue('')
    expect(champNom()).toHaveAttribute('placeholder', 'Dimanche soir')
  })

  it('garde le nom tapé au retour du téléphone depuis l’étape 3', async () => {
    const utilisateur = userEvent.setup()
    const { services, deuxJoueurs } = await base()
    deuxJoueurs()
    ouvrir(services, '/nouvelle-partie')

    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })

    await retourTelephone()
    expect(await screen.findByLabelText(/^Nom de la partie/)).toHaveValue('Finale des potes')
  })

  it('garde le nom tapé avec le bouton retour de l’écran', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base()
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('link', { name: /^Cricket/ }))
    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^Cricket/ }))

    expect(await screen.findByLabelText(/^Nom de la partie/)).toHaveValue('Finale des potes')
  })

  it('repart de la proposition après être sorti du parcours, sans rien mémoriser', async () => {
    const utilisateur = userEvent.setup()
    const { services, ecrites } = await base()
    ouvrir(services, '/')

    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Retour à l’accueil' }))
    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))

    expect(await screen.findByLabelText(/^Nom de la partie/)).toHaveValue('Dimanche soir')
    expect(ecrites.some((valeur) => JSON.stringify(valeur).includes('Finale'))).toBe(false)
  })
})

describe('Nom de la partie — lancement, les quatre jeux', () => {
  it.each(GAME_MODE_IDS)('%s : enregistre le nom tapé, sans les espaces autour', async (mode) => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, deuxJoueurs } = await base()
    if (mode === 'KILLER') deuxJoueurs()
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('link', { name: CARTE[mode] }))
    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    await utilisateur.type(champNom(), '  Finale des potes  ')
    await commencer(utilisateur, mode)

    const partie = await derniere(services)
    expect(partie.mode).toBe(mode)
    expect(partie.name).toBe('Finale des potes')
    expect(await ouverture(dependencies, partie.id)).toMatchObject({ name: 'Finale des potes' })
  })

  it.each(
    GAME_MODE_IDS.flatMap((mode) =>
      (['intact', 'vide', 'espaces'] as const).map((saisie) => [mode, saisie] as const),
    ),
  )('%s, champ %s : n’écrit aucun nom', async (mode, saisie) => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, deuxJoueurs } = await base()
    if (mode === 'KILLER') deuxJoueurs()
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('link', { name: CARTE[mode] }))
    const champ = await screen.findByLabelText(/^Nom de la partie/)
    if (saisie !== 'intact') await utilisateur.clear(champ)
    if (saisie === 'espaces') await utilisateur.type(champ, '    ')
    await commencer(utilisateur, mode)

    const partie = await derniere(services)
    expect(partie.name).toBeNull()
    expect('name' in (await ouverture(dependencies, partie.id))).toBe(false)
  })
})

describe('Nom de la partie — à l’écran', () => {
  it.each(GAME_MODE_IDS)('%s : le bandeau porte le nom tapé', async (mode) => {
    const { services, joueurs } = await base()
    const id = await lancer(services, mode, joueurs(mode), 'Finale des potes')
    ouvrir(services, `/partie/${id}`)

    const bandeau = await screen.findByRole('banner')
    expect(await within(bandeau).findByText('Finale des potes')).toBeInTheDocument()
  })

  it.each(GAME_MODE_IDS)('%s : le bandeau porte le nom par défaut sans nom tapé', async (mode) => {
    const { services, joueurs, clock } = await base()
    const id = await lancer(services, mode, joueurs(mode))
    clock.regler(MARDI_MATIN)
    ouvrir(services, `/partie/${id}`)

    const bandeau = await screen.findByRole('banner')
    expect(await within(bandeau).findByText('Dimanche soir')).toBeInTheDocument()
    expect(within(bandeau).queryByText('Mardi matin')).not.toBeInTheDocument()
  })

  it.each(GAME_MODE_IDS)('%s : le résumé porte le nom en tête', async (mode) => {
    const { services, joueurs } = await base()
    const id = await lancer(services, mode, joueurs(mode), 'Finale des potes')
    ouvrir(services, `/partie/${id}/resume`)

    const nom = await screen.findByText('Finale des potes')
    expect(nom.tagName).toBe('P')
    expect(screen.queryAllByRole('heading', { level: 1 }).length).toBeLessThanOrEqual(1)
  })

  it.each(GAME_MODE_IDS)('%s : le résumé porte le nom par défaut sans nom tapé', async (mode) => {
    const { services, joueurs, clock } = await base()
    const id = await lancer(services, mode, joueurs(mode))
    clock.regler(MARDI_MATIN)
    ouvrir(services, `/partie/${id}/resume`)

    const nom = await screen.findByText('Dimanche soir')
    expect(screen.queryByText('Mardi matin')).not.toBeInTheDocument()
    expect(nom.tagName).toBe('P')
  })

  it('le bandeau réserve la ligne du nom pendant le chargement', () => {
    render(
      <DispositionPartie enTete={<span>Manche 1</span>} nomPartie={null} saisie={null}>
        <p>Zone de lecture</p>
      </DispositionPartie>,
    )

    const lignes = within(screen.getByRole('banner')).getAllByRole('paragraph')
    expect(lignes).toHaveLength(1)
    expect(lignes[0]).toBeEmptyDOMElement()
    expect(lignes[0]).toHaveClass('h-4')
  })

  it('l’historique titre les lignes du nom tapé seulement, jamais du nom par défaut', async () => {
    const { services, dependencies, joueurs } = await base()
    await lancer(services, 'CRICKET', joueurs('CRICKET'), 'Finale des potes')
    await lancer(services, 'X01', joueurs('X01'))
    const [kevin] = joueurs('X01')
    if (!kevin) throw new Error('joueur attendu')
    const samedi = new Date(2026, 9, 10, 15, 0).getTime()
    await dependencies.matches.save({
      id: MatchId.of('ancienne'),
      createdAt: samedi,
      updatedAt: samedi,
      events: [
        {
          type: 'MatchStarted',
          config: X01Config.create({}),
          playerIds: [kevin],
          startingPlayerIndex: 0,
        },
      ],
    })

    ouvrir(services, '/historique')

    const titres = (await screen.findAllByRole('heading', { level: 2 })).map(
      (titre) => titre.textContent,
    )
    expect(titres).toHaveLength(3)
    expect(titres).toContain('Finale des potes')
    expect(titres.join(' ')).not.toMatch(/soir|après-midi|matin|nuit/i)
  })

  it('« On remet ça » garde le nom tapé', async () => {
    const utilisateur = userEvent.setup()
    const { services, joueurs } = await base()
    const id = await lancer(services, 'TOUR_DU_MONDE', joueurs('TOUR_DU_MONDE'), 'Revanche')
    ouvrir(services, `/partie/${id}/resume`)

    await utilisateur.click(await screen.findByRole('button', { name: /On remet ça/ }))

    await waitFor(async () => expect(await services.getMatchHistory.execute()).toHaveLength(2))
    const noms = (await services.getMatchHistory.execute()).map((partie) => partie.name)
    expect(noms).toEqual(['Revanche', 'Revanche'])
    const bandeau = await screen.findByRole('banner')
    expect(await within(bandeau).findByText('Revanche')).toBeInTheDocument()
  })
})
