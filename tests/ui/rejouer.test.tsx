import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Dependencies, Services } from '@/composition/container'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { CLE_JOUEURS } from '@/ui/hooks/useJoueurs'
import { fakeServices, SettableClock } from '../fakes'
import { ouverture } from '../use-cases/lancerPartie'
import { locationCourante } from './gestes'
import { renderWithServices } from './renderWithServices'

const SOIR = new Date(2026, 9, 14, 21).getTime()
const HIER = new Date(2026, 9, 13, 21).getTime()
const JOUR = 86_400_000

const base = async () => {
  const horloge = new SettableClock(SOIR - 5 * JOUR)
  const { services, dependencies } = fakeServices({ clock: horloge })
  const ids = new Map<string, PlayerId>()
  for (const nom of ['Kevin', 'Julien', 'Sarah']) {
    ids.set(nom, (await services.managePlayers.create(nom)).id)
  }
  const id = (nom: string): PlayerId => {
    const trouve = ids.get(nom)
    if (!trouve) throw new Error(`profil ${nom} absent`)
    return trouve
  }
  const x01 = async (
    noms: readonly string[],
    reglages: Parameters<typeof X01Config.create>[0] = {},
    quand = horloge.now() + 1000,
    name?: string,
  ) => {
    horloge.regler(quand)
    return services.startMatch.execute({
      playerIds: noms.map(id),
      config: X01Config.create(reglages),
      ...(name === undefined ? {} : { name }),
    })
  }
  const entrainement = async (nom: string, rounds: number, quand: number) => {
    horloge.regler(quand)
    return services.playCheckoutPractice.start({
      playerId: id(nom),
      config: CheckoutPracticeConfig.create({ rounds }),
    })
  }
  return { services, dependencies, horloge, id, x01, entrainement }
}

const ouvrir = (services: Services) => {
  if (services.clock instanceof SettableClock) services.clock.regler(SOIR)
  return renderWithServices(<App />, { services, route: '/nouvelle-partie' })
}

const lignes = () => within(screen.getByRole('list', { name: 'Rejouer une partie récente' }))

const preference = (dependencies: Dependencies, cle: string) =>
  dependencies.devices.preferences.read(cle, undefined)

describe('Nouvelle partie — étape 1, « Rejouer »', () => {
  it('sans aucune partie : les cinq tuiles, pas de section Rejouer', async () => {
    const { services } = await base()
    ouvrir(services)
    expect(await screen.findByRole('link', { name: /^Entraînement/ })).toBeInTheDocument()

    expect(await screen.findAllByRole('link')).toHaveLength(5)
    await waitFor(() =>
      expect(screen.getByText('Décompter 301, 501 ou 701 jusqu’à zéro pile.')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('heading', { name: 'Rejouer' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ou un autre jeu')).not.toBeInTheDocument()
  })

  it('pendant le chargement : aucun lien de jeu, ni rangée ni tuiles ; puis la section et la rangée', async () => {
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'])
    ouvrir(services)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryByRole('heading', { name: 'Rejouer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ou un autre jeu' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Rejouer' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(5)
  })

  it('pendant le chargement, base vide : aucun lien ; puis les tuiles 2 × 2, sans bascule', async () => {
    const { services } = await base()
    ouvrir(services)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(await screen.findByText(/zéro pile/)).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(5)
  })

  it('trois configurations jouées 4, 1 et 2 fois : trois lignes, la plus récente en tête, le bon « N fois »', async () => {
    const { services, x01 } = await base()
    for (let i = 0; i < 4; i += 1) {
      await x01(['Kevin', 'Julien', 'Sarah'], { doubleOut: false }, HIER - 3 * JOUR + i)
    }
    await x01(['Kevin', 'Julien'], { startingScore: 301, legsToWin: 1 }, HIER - 2 * JOUR)
    await x01(['Julien', 'Sarah'], { startingScore: 701 }, HIER - JOUR)
    await x01(['Sarah', 'Julien'], { startingScore: 701 }, HIER)
    ouvrir(services)

    await screen.findByRole('heading', { name: 'Rejouer' })
    const items = lignes().getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('X01 · 701')
    expect(items[0]).toHaveTextContent('2 fois')
    expect(items[0]).toHaveTextContent('hier')
    expect(items[1]).toHaveTextContent('X01 · 301')
    expect(items[1]).toHaveTextContent('1 manche')
    expect(items[1]).not.toHaveTextContent('fois')
    expect(items[2]).toHaveTextContent('X01 · 501')
    expect(items[2]).toHaveTextContent('4 fois')
    expect(items[2]).toHaveTextContent('premier à 2 manches · checkout libre')
  })

  it('une configuration dont un profil est supprimé n’apparaît pas ; la quatrième la remplace', async () => {
    const { services, x01, id } = await base()
    await x01(['Kevin', 'Julien'], { startingScore: 301 }, HIER - 4 * JOUR)
    await x01(['Kevin', 'Julien'], { startingScore: 701 }, HIER - 3 * JOUR)
    await x01(['Kevin', 'Julien'], { legsToWin: 3 }, HIER - 2 * JOUR)
    await x01(['Kevin', 'Sarah'], {}, HIER)
    await services.managePlayers.remove(id('Sarah'))
    ouvrir(services)

    await screen.findByRole('heading', { name: 'Rejouer' })
    const items = lignes().getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.textContent).join(' ')).not.toContain('Sarah')
    expect(items[2]).toHaveTextContent('X01 · 301')
  })

  it('écarte une configuration non reproductible par le parcours', async () => {
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'], { startingScore: 301 }, HIER - JOUR)
    await x01(['Kevin', 'Julien'], { startingScore: 401 }, HIER)
    ouvrir(services)

    await screen.findByRole('heading', { name: 'Rejouer' })
    const items = lignes().getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('X01 · 301')
  })

  it('range les cinq jeux sous « Ou un autre jeu », vers l’étape 2', async () => {
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'])
    ouvrir(services)

    await screen.findByRole('heading', { name: 'Rejouer' })
    expect(screen.getByRole('heading', { name: 'Ou un autre jeu' })).toBeInTheDocument()
    const cricket = screen.getByRole('link', { name: 'Cricket' })
    expect(cricket).toHaveAttribute('href', '/nouvelle-partie/cricket')
    expect(screen.getByRole('link', { name: 'Solo' })).toHaveAttribute(
      'href',
      '/nouvelle-partie/entrainement',
    )
    expect(screen.queryByRole('link', { name: /Entraînement/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(5)
  })

  it('▶ à deux joueurs ou plus : ouvre l’Ordre avec l’ordre de la dernière fois, les réglages repris, puis « Commencer » lance sans nom', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, x01, id } = await base()
    await x01(
      ['Kevin', 'Julien', 'Sarah'],
      { startingScore: 301, legsToWin: 3, doubleOut: true },
      HIER - JOUR,
    )
    await x01(
      ['Sarah', 'Kevin', 'Julien'],
      { startingScore: 301, legsToWin: 3, doubleOut: true },
      HIER,
      'Chez Paul',
    )
    ouvrir(services)

    const lecture = await screen.findByRole('button', {
      name: 'Rejouer X01 301 avec Sarah, Kevin et Julien',
    })
    await utilisateur.click(lecture)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' }),
    ).toBeInTheDocument()
    expect(locationCourante().pathname).toBe('/nouvelle-partie/x01/ordre')
    const feuille = within(screen.getByRole('list', { name: 'Ordre de passage' }))
    expect(
      feuille
        .getAllByRole('listitem')
        .map((ligne) => ligne.querySelector('.truncate')?.textContent),
    ).toEqual(['Sarah', 'Kevin', 'Julien'])

    expect(preference(dependencies, 'partie:score')).toBe(301)
    expect(preference(dependencies, 'partie:legs')).toBe(3)
    expect(preference(dependencies, 'partie:double-out')).toBe(true)
    expect(preference(dependencies, 'partie:joueurs')).toEqual([
      id('Sarah'),
      id('Kevin'),
      id('Julien'),
    ])

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    const debut = await ouverture(dependencies, lancee.id)
    expect(debut).toMatchObject({
      config: { startingScore: 301, legsToWin: 3, doubleOut: true },
      playerIds: [id('Sarah'), id('Kevin'), id('Julien')],
    })
    expect('name' in debut).toBe(false)
  })

  it('le nom tapé avant un retour ne fuit pas dans la partie rejouée', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, x01 } = await base()
    await x01(['Kevin', 'Julien'], {}, HIER)
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })

    await utilisateur.type(await screen.findByLabelText(/Nom de la partie/), ' Soirée spéciale')
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Rejouer X01 501/ }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    expect('name' in (await ouverture(dependencies, lancee.id))).toBe(false)
  })

  it('le retour depuis l’Ordre ramène à l’étape 1', async () => {
    const utilisateur = userEvent.setup()
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'])
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('button', { name: /^Rejouer X01 501/ }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))

    expect(await screen.findByRole('heading', { name: 'Rejouer' })).toBeInTheDocument()
    expect(locationCourante().pathname).toBe('/nouvelle-partie')
  })

  it('▶ en solo (entraînement) lance directement, avec les mêmes réglages, et mémorise le joueur', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, entrainement, id } = await base()
    await entrainement('Julien', 5, HIER)
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Lancer Entraînement 5 checkouts avec Julien' }),
    )
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    const debut = await ouverture(dependencies, lancee.id)
    expect(debut).toMatchObject({ config: { rounds: 5 }, playerIds: [id('Julien')] })
    expect('name' in debut).toBe(false)
    expect(preference(dependencies, 'entrainement:sorties')).toBe(5)
    expect(preference(dependencies, 'entrainement:joueur')).toBe(id('Julien'))
  })

  it('▶ pour un mode à un seul joueur (Cricket) lance directement avec la variante de la ligne', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, horloge, id } = await base()
    horloge.regler(HIER)
    await services.playCricket.start({
      playerIds: [id('Kevin')],
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
    })
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Lancer Cricket Cut-throat avec Kevin' }),
    )
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    expect(await ouverture(dependencies, lancee.id)).toMatchObject({
      config: { variant: 'CUT_THROAT' },
      playerIds: [id('Kevin')],
    })
    expect(preference(dependencies, 'partie:variante-cricket')).toBe('CUT_THROAT')
  })

  it('après ▶, l’étape 2 montre les réglages repris', async () => {
    const utilisateur = userEvent.setup()
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'], { legsToWin: 4 }, HIER)
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('button', { name: /^Rejouer X01 501/ }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('link', { name: 'X01' }))

    const manches = within(await screen.findByRole('group', { name: 'Manches à gagner' }))
    expect(manches.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('échec du lancement solo : le message d’erreur existant, sous la section', async () => {
    const utilisateur = userEvent.setup()
    const { services, entrainement } = await base()
    await entrainement('Julien', 5, HIER)
    const echec: Services = {
      ...services,
      playCheckoutPractice: {
        ...services.playCheckoutPractice,
        start: () => Promise.reject(new Error('disque plein')),
      },
    }
    ouvrir(echec)

    await utilisateur.click(await screen.findByRole('button', { name: /^Lancer Entraînement/ }))
    expect(await screen.findByText('Impossible de démarrer la partie.')).toBeInTheDocument()
    expect(locationCourante().pathname).toBe('/nouvelle-partie')
  })

  it('la liste suit la partie qu’on vient de lancer (clé sous l’historique)', async () => {
    const { services, x01 } = await base()
    await x01(['Kevin', 'Julien'], {}, HIER)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderWithServices(<App />, { services, route: '/nouvelle-partie', queryClient })

    const ligne = await screen.findByRole('button', { name: /^Rejouer X01 501/ })
    expect(ligne.closest('li')).not.toHaveTextContent('fois')

    await x01(['Kevin', 'Julien'], {}, SOIR)
    await queryClient.invalidateQueries({ queryKey: ['historique'] })

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Rejouer X01 501/ }).closest('li'),
      ).toHaveTextContent('2 fois'),
    )
  })
})

describe('Nouvelle partie — « Rejouer », les autres modes et les cas écartés', () => {
  const partieLancee = async (services: Services, dependencies: Dependencies) => {
    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    return ouverture(dependencies, lancee.id)
  }

  it('historique de parties toutes non rejouables : les tuiles 2 × 2, sans section Rejouer', async () => {
    const { services, x01, id } = await base()
    await x01(['Kevin', 'Julien'], { startingScore: 401 }, HIER - JOUR) // valeur hors liste
    await x01(['Kevin', 'Sarah'], {}, HIER) // profil supprimé ensuite
    await services.managePlayers.remove(id('Sarah'))
    ouvrir(services)

    expect(await screen.findByText(/zéro pile/)).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.queryByRole('heading', { name: 'Rejouer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ou un autre jeu' })).not.toBeInTheDocument()
  })

  it('une partie importée à sortie mal typée ("oui") n’est jamais proposée : les tuiles 2 × 2', async () => {
    const { services, dependencies, x01 } = await base()
    const matchId = await x01(['Kevin', 'Julien'], {}, HIER)
    const record = await dependencies.matches.findById(matchId)
    const [ouvertureDuJournal, ...suite] = record?.events ?? []
    if (!record || !ouvertureDuJournal || !('config' in ouvertureDuJournal)) {
      throw new Error('journal inattendu')
    }
    await dependencies.matches.save({
      ...record,
      events: [
        { ...ouvertureDuJournal, config: { ...ouvertureDuJournal.config, doubleOut: 'oui' } },
        ...suite,
      ] as unknown as typeof record.events,
    })
    ouvrir(services)

    expect(await screen.findByText(/zéro pile/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rejouer' })).not.toBeInTheDocument()
  })

  it('une partie importée à cinq joueurs n’est jamais proposée : les tuiles 2 × 2', async () => {
    const { services, dependencies, x01, id } = await base()
    for (const nom of ['Lucie', 'Paul']) await services.managePlayers.create(nom)
    const tous = await services.managePlayers.listAll()
    const matchId = await x01(['Kevin'], {}, HIER)
    const record = await dependencies.matches.findById(matchId)
    const [ouvertureDuJournal, ...suite] = record?.events ?? []
    if (!record || !ouvertureDuJournal || !('playerIds' in ouvertureDuJournal)) {
      throw new Error('journal inattendu')
    }
    await dependencies.matches.save({
      ...record,
      events: [
        { ...ouvertureDuJournal, playerIds: tous.map((joueur) => joueur.id) },
        ...suite,
      ] as unknown as typeof record.events,
    })
    expect(tous).toHaveLength(5)
    expect(tous.map((joueur) => joueur.id)).toContain(id('Kevin'))
    ouvrir(services)

    expect(await screen.findByText(/zéro pile/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rejouer' })).not.toBeInTheDocument()
  })

  it('un profil supprimé après la lecture de l’historique écarte sa ligne (cache périmé)', async () => {
    const { services, x01, id } = await base()
    await x01(['Kevin', 'Julien'], {}, HIER - JOUR)
    await x01(['Kevin'], { startingScore: 301 }, HIER)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderWithServices(<App />, { services, route: '/nouvelle-partie', queryClient })

    await screen.findByRole('heading', { name: 'Rejouer' })
    expect(lignes().getAllByRole('listitem')).toHaveLength(2)

    await services.managePlayers.remove(id('Julien'))
    await queryClient.invalidateQueries({ queryKey: CLE_JOUEURS })

    await waitFor(() => expect(lignes().getAllByRole('listitem')).toHaveLength(1))
    expect(lignes().getByRole('listitem')).toHaveTextContent('X01 · 301')
  })

  it('▶ Cricket à plusieurs : écrit la variante, ouvre l’Ordre, puis lance cette variante', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, horloge, id } = await base()
    horloge.regler(HIER)
    await services.playCricket.start({
      playerIds: [id('Kevin'), id('Julien')],
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
    })
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', {
        name: 'Rejouer Cricket Cut-throat avec Kevin et Julien',
      }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' }),
    ).toBeInTheDocument()
    expect(locationCourante().pathname).toBe('/nouvelle-partie/cricket/ordre')
    expect(preference(dependencies, 'partie:variante-cricket')).toBe('CUT_THROAT')

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))
    const debut = await partieLancee(services, dependencies)
    expect(debut).toMatchObject({
      config: { variant: 'CUT_THROAT' },
      playerIds: [id('Kevin'), id('Julien')],
    })
    expect('name' in debut).toBe(false)
  })

  it('▶ Tour du monde à plusieurs : ouvre l’Ordre dans l’ordre de la dernière fois', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, horloge, id } = await base()
    horloge.regler(HIER)
    await services.playTourDuMonde.start({
      playerIds: [id('Sarah'), id('Kevin')],
      config: TourDuMondeConfig.create(),
    })
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Rejouer Tour du monde avec Sarah et Kevin' }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' }),
    ).toBeInTheDocument()
    expect(locationCourante().pathname).toBe('/nouvelle-partie/tour-du-monde/ordre')
    expect(preference(dependencies, 'partie:joueurs')).toEqual([id('Sarah'), id('Kevin')])

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))
    expect(await partieLancee(services, dependencies)).toMatchObject({
      playerIds: [id('Sarah'), id('Kevin')],
    })
  })

  it('▶ X01 à un seul joueur : lancement direct, réglages non par défaut repris', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, x01, id } = await base()
    await x01(['Kevin'], { startingScore: 701, legsToWin: 3, doubleOut: false }, HIER)
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Lancer X01 701 avec Kevin' }),
    )
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const debut = await partieLancee(services, dependencies)
    expect(debut).toMatchObject({
      config: { startingScore: 701, legsToWin: 3, doubleOut: false },
      playerIds: [id('Kevin')],
    })
    expect('name' in debut).toBe(false)
    expect(preference(dependencies, 'partie:score')).toBe(701)
  })

  it('▶ Tour du monde en solo : lancement direct', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, horloge, id } = await base()
    horloge.regler(HIER)
    await services.playTourDuMonde.start({
      playerIds: [id('Kevin')],
      config: TourDuMondeConfig.create(),
    })
    ouvrir(services)

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Lancer Tour du monde avec Kevin' }),
    )
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))
    expect(await partieLancee(services, dependencies)).toMatchObject({
      playerIds: [id('Kevin')],
    })
  })
})
