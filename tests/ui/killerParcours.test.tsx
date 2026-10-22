import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Dependencies, Services } from '@/composition/container'
import { KillerConfig } from '@/core/domain/games/killer/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'
import { ouverture } from '../use-cases/lancerPartie'
import { locationCourante, retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

const NOMS = ['Kevin', 'Julien', 'Sarah', 'Marie', 'Paul', 'Lea'] as const

const base = async (retenus: readonly string[] = []) => {
  const horloge = new SettableClock(new Date(2026, 9, 14, 21).getTime())
  const { services, dependencies } = fakeServices({ clock: horloge })
  const ids = new Map<string, PlayerId>()
  for (const nom of NOMS) ids.set(nom, (await services.managePlayers.create(nom)).id)
  const id = (nom: string): PlayerId => {
    const trouve = ids.get(nom)
    if (!trouve) throw new Error(`profil ${nom} absent`)
    return trouve
  }
  if (retenus.length > 0) dependencies.devices.preferences.write('partie:joueurs', retenus.map(id))
  return { services, dependencies, id, horloge }
}

const ouvrir = (services: Services, route = '/nouvelle-partie/killer') =>
  renderWithServices(<App />, { services, route })

const preference = (dependencies: Dependencies, cle: string) =>
  dependencies.devices.preferences.read(cle, undefined)

const blocNumeros = () => screen.getByRole('region', { name: 'Numéros' })

const tuile = (nom: string) =>
  within(blocNumeros()).getByRole('button', { name: new RegExp(`^Numéro de ${nom}`) })

const numeroDe = (nom: string): number => {
  const trouve = /: (\d+),/.exec(tuile(nom).getAttribute('aria-label') ?? '')
  if (!trouve?.[1]) throw new Error(`pas de numéro pour ${nom}`)
  return Number(trouve[1])
}

const numerosDe = (noms: readonly string[]) => noms.map(numeroDe)

const tousDifferents = (numeros: readonly number[]) => new Set(numeros).size === numeros.length

const attendreNumeros = (noms: readonly string[]) =>
  waitFor(() => {
    const numeros = numerosDe(noms)
    expect(tousDifferents(numeros)).toBe(true)
    for (const numero of numeros) {
      expect(numero).toBeGreaterThanOrEqual(1)
      expect(numero).toBeLessThanOrEqual(20)
    }
  })

describe('Killer — étape 1', () => {
  it('a sa tuile, avec « 2 à 6 joueurs » sur elle seule', async () => {
    const { services } = await base()
    ouvrir(services, '/nouvelle-partie')

    const killer = await screen.findByRole('link', { name: /^Killer/ })
    expect(killer).toHaveAttribute('href', '/nouvelle-partie/killer')
    expect(killer).toHaveAccessibleName(/Un numéro, des vies : le dernier en vie gagne\./)
    expect(killer).toHaveTextContent('2 à 6 joueurs')
    expect(screen.getAllByText('2 à 6 joueurs')).toHaveLength(1)
  })
})

describe('Killer — étape 2, la fiche', () => {
  it('dit « 3 vies · N joueurs » et mémorise vies et variante', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'])
    ouvrir(services)

    await screen.findByRole('region', { name: 'Numéros' })
    const recap = screen.getByLabelText('Réglages choisis')
    expect(recap).toHaveTextContent('3 vies · 2 joueurs')
    expect(recap).toHaveTextContent('Son propre numéro : sans effet')

    const vies = within(screen.getByRole('group', { name: 'Vies de départ' }))
    await utilisateur.click(vies.getByRole('button', { name: '5' }))
    expect(recap).toHaveTextContent('5 vies · 2 joueurs')
    expect(preference(dependencies, 'partie:killer-vies')).toBe(5)

    const variante = screen.getByRole('button', { name: /Son propre numéro coûte des vies/ })
    expect(variante).toHaveAttribute('aria-pressed', 'false')
    await utilisateur.click(variante)
    expect(variante).toHaveAttribute('aria-pressed', 'true')
    expect(recap).toHaveTextContent('Son propre numéro coûte des vies')
    expect(preference(dependencies, 'partie:killer-variante')).toBe(true)
  })
})

describe('Killer — étape 2, les numéros', () => {
  it('sont déjà tirés à l’arrivée, tous différents', async () => {
    const { services } = await base(['Kevin', 'Julien', 'Sarah'])
    ouvrir(services)

    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien', 'Sarah'])
    expect(blocNumeros()).toHaveTextContent('3 sur 3 attribués · tous différents')
  })

  it('la grille ne propose que les numéros libres, se referme après un choix, sans entrée d’historique', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'])
    renderWithServices(<App />, {
      services,
      historique: ['/nouvelle-partie', '/nouvelle-partie/killer'],
    })
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien'])
    const julien = numeroDe('Julien')
    const avant = numeroDe('Kevin')

    await utilisateur.click(tuile('Kevin'))
    expect(tuile('Kevin')).toHaveAttribute('aria-expanded', 'true')
    const grille = within(screen.getByRole('list', { name: 'Numéro de Kevin' }))
    expect(grille.getByRole('img', { name: `${julien}, pris par Julien` })).toBeInTheDocument()
    expect(grille.queryByRole('button', { name: new RegExp(`^${julien}$`) })).toBeNull()
    expect(grille.getAllByRole('button')).toHaveLength(19)
    expect(grille.getByRole('button', { pressed: true })).toHaveTextContent(String(avant))

    const libre = [...Array(20).keys()]
      .map((rang) => rang + 1)
      .find((numero) => numero !== julien && numero !== avant)
    await utilisateur.click(grille.getByRole('button', { name: String(libre) }))

    expect(screen.queryByRole('list', { name: 'Numéro de Kevin' })).toBeNull()
    expect(tuile('Kevin')).toHaveAttribute('aria-expanded', 'false')
    expect(numeroDe('Kevin')).toBe(libre)
    expect(numeroDe('Julien')).toBe(julien)

    await retourTelephone()
    await waitFor(() => expect(locationCourante().pathname).toBe('/nouvelle-partie'))
  })

  it('le retour du téléphone ne referme pas la grille : il quitte l’étape', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'])
    renderWithServices(<App />, {
      services,
      historique: ['/nouvelle-partie', '/nouvelle-partie/killer'],
    })
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien'])

    await utilisateur.click(tuile('Kevin'))
    await retourTelephone()
    await waitFor(() => expect(locationCourante().pathname).toBe('/nouvelle-partie'))
  })

  it('« Tirer au sort » refait le tirage : toujours tous différents', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Sarah', 'Marie', 'Paul', 'Lea'])
    ouvrir(services)
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(NOMS)

    for (let tour = 0; tour < 3; tour += 1) {
      await utilisateur.click(screen.getByRole('button', { name: 'Tirer au sort les numéros' }))
      await attendreNumeros(NOMS)
    }
    expect(blocNumeros()).toHaveTextContent('6 sur 6 attribués · tous différents')
  })

  it('un joueur ajouté reçoit un numéro libre, un joueur retiré libère sa rangée', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'])
    ouvrir(services)
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien'])
    const avant = numerosDe(['Kevin', 'Julien'])

    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Sarah/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien', 'Sarah'])
    expect(numerosDe(['Kevin', 'Julien'])).toEqual(avant)

    await utilisateur.click(screen.getByRole('button', { name: 'Retirer Julien de la partie' }))
    await waitFor(() =>
      expect(within(blocNumeros()).queryByRole('button', { name: /^Numéro de Julien/ })).toBeNull(),
    )
    expect(blocNumeros()).toHaveTextContent('2 sur 2 attribués')
  })

  it('ré-ajouter un joueur dont l’ancien numéro a été pris entre-temps : il en reçoit un autre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Sarah'])
    ouvrir(services)
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien', 'Sarah'])
    const ancienDeJulien = numeroDe('Julien')

    await utilisateur.click(screen.getByRole('button', { name: 'Retirer Julien de la partie' }))
    await waitFor(() =>
      expect(within(blocNumeros()).queryByRole('button', { name: /^Numéro de Julien/ })).toBeNull(),
    )
    await utilisateur.click(tuile('Kevin'))
    const grille = within(screen.getByRole('list', { name: 'Numéro de Kevin' }))
    await utilisateur.click(grille.getByRole('button', { name: String(ancienDeJulien) }))
    expect(numeroDe('Kevin')).toBe(ancienDeJulien)

    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Julien/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Sarah', 'Julien'])
    expect(numeroDe('Kevin')).toBe(ancienDeJulien)
    expect(numeroDe('Julien')).not.toBe(ancienDeJulien)
    expect(blocNumeros()).toHaveTextContent('3 sur 3 attribués · tous différents')
  })

  it('réordonner à l’étape Ordre garde le numéro de chacun', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, id } = await base(['Kevin', 'Julien', 'Sarah'])
    ouvrir(services)
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien', 'Sarah'])
    const numeros = new Map(
      (['Kevin', 'Julien', 'Sarah'] as const).map((nom) => [id(nom), numeroDe(nom)]),
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
    await utilisateur.click(screen.getByRole('button', { name: /^Tirer au sort/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    const debut = await ouverture(dependencies, lancee.id)
    if (debut.type !== 'KillerStarted') throw new Error('pas un Killer')
    debut.playerIds.forEach((joueur, rang) => {
      expect(debut.numbers[rang]).toBe(numeros.get(joueur))
    })
  })
})

describe('Killer — moins de deux joueurs', () => {
  it.each([
    [0, []],
    [1, ['Kevin']],
  ] as const)(
    'à %i joueur : la consigne, « Continuer » désactivé, Ordre grisé',
    async (_, retenus) => {
      const { services } = await base(retenus)
      ouvrir(services)

      expect(
        await screen.findByText(
          'Le Killer se joue de 2 à 6 joueurs. Ajoutez au moins un joueur : les numéros seront tirés tout de suite.',
        ),
      ).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Numéros' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'Commencer' })).toBeNull()

      const barre = within(screen.getByRole('list', { name: 'Étapes de la partie' }))
      const ordre = barre.getAllByRole('listitem')[2]
      expect(ordre).toHaveTextContent('3 · Ordre')
      expect(ordre).toHaveAttribute('data-etat', 'grise')
    },
  )
})

describe('Killer — la sélection coupée au changement de jeu', () => {
  it('un Killer à 6 puis un X01 : les 5e et 6e sont perdus, même en revenant au Killer', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, id } = await base([...NOMS])
    ouvrir(services, '/nouvelle-partie')

    await utilisateur.click(await screen.findByRole('link', { name: /^Killer/ }))
    expect(await screen.findByText('6 / 6')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    expect(await screen.findByText('4 / 4')).toBeInTheDocument()
    await waitFor(() =>
      expect(preference(dependencies, 'partie:joueurs')).toEqual(
        ['Kevin', 'Julien', 'Sarah', 'Marie'].map(id),
      ),
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^Killer/ }))
    expect(await screen.findByText('4 / 6')).toBeInTheDocument()
  })
})

describe('Killer — lancement', () => {
  it('lance un Killer complet jusqu’à l’écran de partie, avec vies, variante et numéros', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, id } = await base(['Kevin', 'Julien', 'Sarah'])
    ouvrir(services)
    await screen.findByRole('region', { name: 'Numéros' })
    await attendreNumeros(['Kevin', 'Julien', 'Sarah'])
    await utilisateur.click(
      within(screen.getByRole('group', { name: 'Vies de départ' })).getByRole('button', {
        name: '5',
      }),
    )
    await utilisateur.click(
      screen.getByRole('button', { name: /Son propre numéro coûte des vies/ }),
    )
    const numeros = numerosDe(['Kevin', 'Julien', 'Sarah'])

    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))
    expect(await screen.findByText('Killer')).toBeInTheDocument()

    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    expect(lancee.mode).toBe('KILLER')
    expect(await ouverture(dependencies, lancee.id)).toMatchObject({
      type: 'KillerStarted',
      playerIds: ['Kevin', 'Julien', 'Sarah'].map(id),
      numbers: numeros,
      config: { startingLives: 5, selfHitCostsLives: true },
    })
  })
})

describe('Killer — Rejouer', () => {
  const unKiller = async (
    services: Services,
    horloge: SettableClock,
    playerIds: readonly PlayerId[],
    selfHitCostsLives: boolean,
  ) => {
    horloge.regler(new Date(2026, 9, 13, 21).getTime())
    const matchId = await services.playKiller.start({
      playerIds,
      config: KillerConfig.create({ startingLives: 5, selfHitCostsLives }),
      numbers: [1, 2, 3, 4, 5].slice(0, playerIds.length) as never,
    })
    horloge.regler(new Date(2026, 9, 14, 21).getTime())
    return matchId
  }

  it('ligne « Killer · 5 vies », la variante seulement activée, puis Ordre et nouveau tirage', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, id, horloge } = await base()
    const joueurs = ['Kevin', 'Julien', 'Sarah', 'Marie', 'Paul'].map(id)
    await unKiller(services, horloge, joueurs, true)
    ouvrir(services, '/nouvelle-partie')

    const ligne = (await screen.findByRole('button', { name: /^Rejouer Killer 5 vies/ })).closest(
      'li',
    )
    expect(ligne).toHaveTextContent('Killer · 5 vies')
    expect(ligne).toHaveTextContent('son propre numéro coûte')
    expect(screen.getByRole('button', { name: /^Rejouer Killer/ })).toHaveAccessibleName(
      'Rejouer Killer 5 vies son propre numéro coûte avec Kevin, Julien, Sarah, Marie et Paul',
    )

    await utilisateur.click(screen.getByRole('button', { name: /^Rejouer Killer/ }))
    await screen.findByRole('heading', { level: 1, name: 'Ordre de jeu' })
    expect(locationCourante().pathname).toBe('/nouvelle-partie/killer/ordre')
    expect(preference(dependencies, 'partie:killer-vies')).toBe(5)
    expect(preference(dependencies, 'partie:killer-variante')).toBe(true)

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(() => expect(locationCourante().pathname).toMatch(/^\/partie\//))
    const lancee = (await services.getMatchHistory.execute(1))[0]
    if (!lancee) throw new Error('aucune partie lancée')
    const debut = await ouverture(dependencies, lancee.id)
    if (debut.type !== 'KillerStarted') throw new Error('pas un Killer')
    expect(debut.playerIds).toEqual(joueurs)
    expect(debut.config).toEqual({ startingLives: 5, selfHitCostsLives: true })
    expect(tousDifferents(debut.numbers)).toBe(true)
    expect(debut.numbers).toHaveLength(5)
    expect(debut.numbers).not.toEqual([1, 2, 3, 4, 5])
    expect('name' in debut).toBe(false)
  })

  it('variante désactivée : la ligne ne la mentionne pas', async () => {
    const { services, id, horloge } = await base()
    await unKiller(services, horloge, ['Kevin', 'Julien'].map(id), false)
    ouvrir(services, '/nouvelle-partie')

    const bouton = await screen.findByRole('button', { name: /^Rejouer Killer/ })
    expect(bouton).toHaveAccessibleName('Rejouer Killer 5 vies avec Kevin et Julien')
    expect(bouton.closest('li')).not.toHaveTextContent('son propre numéro')
  })
})
