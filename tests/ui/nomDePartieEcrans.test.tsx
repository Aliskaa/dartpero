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

/** Dimanche 11 octobre 2026, 21 h, heure locale : « Dimanche soir ». */
const DIMANCHE_SOIR = new Date(2026, 9, 11, 21, 0).getTime()

/** Des préférences qui gardent la trace de tout ce qu'on y écrit. */
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
  // Kevin seul retenu : chaque jeu se lance dès l'étape 2, sans étape d'ordre.
  preferences.write('partie:joueurs', [kevin])
  ecrites.length = 0
  const joueurs = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]
  return { services, dependencies, ecrites, joueurs, clock }
}

/**
 * Mardi 13 octobre 2026, 9 h : un **autre jour** que la création. Les cas « nom
 * par défaut » y avancent l'horloge avant d'ouvrir l'écran, pour prouver que
 * le nom vient de la date de création et non de l'heure courante.
 */
const MARDI_MATIN = new Date(2026, 9, 13, 9, 0).getTime()

const ouvrir = (services: Services, route = '/nouvelle-partie') =>
  renderWithServices(<App />, { services, route })

const champNom = () => screen.getByLabelText('Nom de la partie')

const CARTE: Record<GameModeId, RegExp> = {
  X01: /^X01/,
  CRICKET: /^Cricket/,
  TOUR_DU_MONDE: /^Tour du monde/,
  CHECKOUT_PRACTICE: /^Entraînement/,
}

const derniere = async (services: Services) => {
  await waitFor(async () => expect(await services.getMatchHistory.execute()).toHaveLength(1))
  const [partie] = await services.getMatchHistory.execute()
  if (!partie) throw new Error('aucune partie lancée')
  return partie
}

describe('Nom de la partie — étape 1', () => {
  /** Critère 1. */
  it('propose « Dimanche soir » un dimanche à 21 h, sans prendre le focus', async () => {
    const { services } = await base()
    ouvrir(services)

    const champ = await screen.findByLabelText('Nom de la partie')
    expect(champ).toHaveValue('Dimanche soir')
    expect(champ).not.toHaveFocus()
    expect(champ).not.toBeRequired()
  })

  /** Critère 6, côté écran : 31 caractères ne peuvent pas être saisis. */
  it('limite la saisie à 30 caractères', async () => {
    const { services } = await base()
    ouvrir(services)

    expect(await screen.findByLabelText('Nom de la partie')).toHaveAttribute('maxLength', '30')
  })

  it('montre la proposition en filigrane quand on vide le champ', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base()
    ouvrir(services)

    await utilisateur.clear(await screen.findByLabelText('Nom de la partie'))
    expect(champNom()).toHaveValue('')
    expect(champNom()).toHaveAttribute('placeholder', 'Dimanche soir')
  })

  /** Critère 10. */
  it('garde le nom tapé au retour du téléphone depuis l’étape 2', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base()
    ouvrir(services)

    await utilisateur.clear(await screen.findByLabelText('Nom de la partie'))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('link', { name: /^X01/ }))
    await screen.findByRole('heading', { level: 1, name: 'X01' })

    await retourTelephone()
    expect(await screen.findByLabelText('Nom de la partie')).toHaveValue('Finale des potes')
  })

  it('garde le nom tapé avec le bouton retour de l’écran', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base()
    ouvrir(services)

    await utilisateur.clear(await screen.findByLabelText('Nom de la partie'))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('link', { name: /^Cricket/ }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Étape précédente' }))

    expect(await screen.findByLabelText('Nom de la partie')).toHaveValue('Finale des potes')
  })

  it('repart de la proposition après être sorti du parcours, sans rien mémoriser', async () => {
    const utilisateur = userEvent.setup()
    const { services, ecrites } = await base()
    ouvrir(services, '/')

    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.clear(await screen.findByLabelText('Nom de la partie'))
    await utilisateur.type(champNom(), 'Finale des potes')
    await utilisateur.click(screen.getByRole('button', { name: 'Retour à l’accueil' }))
    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))

    expect(await screen.findByLabelText('Nom de la partie')).toHaveValue('Dimanche soir')
    expect(ecrites.some((valeur) => JSON.stringify(valeur).includes('Finale'))).toBe(false)
  })
})

describe('Nom de la partie — lancement, les quatre jeux', () => {
  /** Critères 4 et 5. */
  it.each(GAME_MODE_IDS)('%s : enregistre le nom tapé, sans les espaces autour', async (mode) => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base()
    ouvrir(services)

    await utilisateur.clear(await screen.findByLabelText('Nom de la partie'))
    await utilisateur.type(champNom(), '  Finale des potes  ')
    await utilisateur.click(screen.getByRole('link', { name: CARTE[mode] }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))

    const partie = await derniere(services)
    expect(partie.mode).toBe(mode)
    expect(partie.name).toBe('Finale des potes')
    expect(await ouverture(dependencies, partie.id)).toMatchObject({ name: 'Finale des potes' })
  })

  /** Critères 3 et 5 : laissé sur la proposition, vidé, ou fait d'espaces. */
  it.each(
    GAME_MODE_IDS.flatMap((mode) =>
      (['intact', 'vide', 'espaces'] as const).map((saisie) => [mode, saisie] as const),
    ),
  )('%s, champ %s : n’écrit aucun nom', async (mode, saisie) => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base()
    ouvrir(services)

    const champ = await screen.findByLabelText('Nom de la partie')
    if (saisie !== 'intact') await utilisateur.clear(champ)
    if (saisie === 'espaces') await utilisateur.type(champ, '    ')
    await utilisateur.click(screen.getByRole('link', { name: CARTE[mode] }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))

    const partie = await derniere(services)
    expect(partie.name).toBeNull()
    expect('name' in (await ouverture(dependencies, partie.id))).toBe(false)
  })
})

describe('Nom de la partie — à l’écran', () => {
  /** Critère 4 : pendant la partie, dans le bandeau. */
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

  /** Critère 4 : en tête du résumé, sans second titre de niveau 1. */
  it.each(GAME_MODE_IDS)('%s : le résumé porte le nom en tête', async (mode) => {
    const { services, joueurs } = await base()
    const id = await lancer(services, mode, joueurs(mode), 'Finale des potes')
    ouvrir(services, `/partie/${id}/resume`)

    const nom = await screen.findByText('Finale des potes')
    expect(nom.tagName).toBe('P')
    // Un paragraphe, jamais un second titre : le seul `<h1>` reste le vainqueur.
    expect(screen.queryAllByRole('heading', { level: 1 }).length).toBeLessThanOrEqual(1)
  })

  /** Critère 3 : sans nom tapé, le résumé porte le nom de la date de création. */
  it.each(GAME_MODE_IDS)('%s : le résumé porte le nom par défaut sans nom tapé', async (mode) => {
    const { services, joueurs, clock } = await base()
    const id = await lancer(services, mode, joueurs(mode))
    clock.regler(MARDI_MATIN)
    ouvrir(services, `/partie/${id}/resume`)

    const nom = await screen.findByText('Dimanche soir')
    expect(screen.queryByText('Mardi matin')).not.toBeInTheDocument()
    expect(nom.tagName).toBe('P')
  })

  /**
   * Critère 11, la part que jsdom peut voir : la ligne du nom existe **avant**
   * que le nom arrive (`nomPartie = null`), avec sa hauteur réservée — sinon la
   * zone de lecture sauterait à l'arrivée du nom. Le rendu lui-même reste à
   * relire à l'écran.
   */
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

  /**
   * Critères 4 et 7, puis `cartes-partie` : seul un nom TAPÉ titre une ligne ; sans
   * nom (défaut ou partie d'avant le lot), le titre est la règle du jeu, jamais « Dimanche soir ».
   */
  it('l’historique titre les lignes du nom tapé seulement, jamais du nom par défaut', async () => {
    const { services, dependencies, joueurs } = await base()
    await lancer(services, 'CRICKET', joueurs('CRICKET'), 'Finale des potes')
    await lancer(services, 'X01', joueurs('X01'))
    const [kevin] = joueurs('X01')
    if (!kevin) throw new Error('joueur attendu')
    // Un samedi après-midi, enregistré avant le lot : pas de clé `name`.
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

  /** Critère 9, de bout en bout : « On remet ça » garde le nom tapé. */
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
