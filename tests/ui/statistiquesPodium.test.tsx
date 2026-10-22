import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'
import { retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

// ⚠️ En dur, à dessein : la clé est citée par la politique de confidentialité.
const CLE = 'statistiques:joueur'

const S20 = [Dart.single(20), Dart.single(20), Dart.single(20)]
const RIEN = [Dart.miss(), Dart.miss(), Dart.miss()]

const partie = async (
  services: Services,
  joueurs: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  config = X01Config.create({ legsToWin: 1 }),
) => {
  const matchId = await services.startMatch.execute({ playerIds: [...joueurs], config })
  for (const darts of volees) await services.recordVisit.execute({ matchId, darts: [...darts] })
  return matchId
}

const troisJoueurs = async () => {
  const { services, dependencies } = fakeServices()
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const sarah = await services.managePlayers.create('Sarah')
  await partie(services, [kevin.id], [S20, S20, S20])
  await partie(
    services,
    [julien.id],
    [[Dart.triple(20), Dart.single(20), Dart.single(20)], RIEN, RIEN, RIEN],
  )
  await partie(services, [sarah.id], [[Dart.single(5), Dart.single(5), Dart.single(5)]])
  return { services, dependencies, kevin, julien, sarah }
}

const cible = () => screen.findByRole('img', { name: /fléchettes$/ })
const ruban = () => screen.getByRole('group', { name: 'Joueur' })
const ordre = (region: HTMLElement) =>
  within(region)
    .getAllByRole('listitem')
    .map(
      (ligne) =>
        within(ligne).getAllByText(/^(Kevin|Julien|Sarah|Joueur supprimé)$/)[0]?.textContent,
    )

const valeursDe = (region: HTMLElement) =>
  within(region)
    .getAllByRole('listitem')
    .map((li) => {
      const colonne = li.children[3] as HTMLElement
      return [
        li.children[1]?.textContent,
        colonne.children[0]?.textContent,
        colonne.children[1]?.textContent ?? null,
      ]
    })

describe('Statistiques — la cible et le joueur mémorisé', () => {
  it('sans préférence, montre la cible du premier de la moyenne', async () => {
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect((await cible()).getAttribute('aria-label')).toMatch(/^Kevin :/)
    expect(within(ruban()).getByRole('button', { name: 'Kevin' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('un total à zéro s’écrit « 0 », jamais le mot « Hors » ; un nombre non nul reste affiché', async () => {
    const { services, dependencies, julien } = await troisJoueurs()
    const derniereCase = () =>
      cible().then((plateau) => {
        const cases = within(plateau.closest('figure') as HTMLElement).getAllByRole('listitem')
        return cases[cases.length - 1]?.textContent
      })

    const { unmount } = renderWithServices(<App />, { services, route: '/statistiques' })
    expect(await derniereCase()).toBe('0hors cible')
    unmount()

    dependencies.devices.preferences.write(CLE, julien.id)
    renderWithServices(<App />, { services, route: '/statistiques' })
    expect(await derniereCase()).toBe('9hors cible')
  })

  it('la ligne « Hors cible par partie » : 0,0 à zéro, 9,0 pour 9 sur 1 partie (singulier)', async () => {
    const { services, dependencies, julien } = await troisJoueurs()
    const ligne = () => screen.findByText('Hors cible par partie').then((l) => l.closest('p'))

    const { unmount } = renderWithServices(<App />, { services, route: '/statistiques' })
    expect((await ligne())?.textContent).toBe('Hors cible par partie0,0sur 1 partie')
    unmount()

    dependencies.devices.preferences.write(CLE, julien.id)
    renderWithServices(<App />, { services, route: '/statistiques' })
    expect((await ligne())?.textContent).toBe('Hors cible par partie9,0sur 1 partie')
  })

  it('la moyenne suit la période : numérateur et nombre de parties filtrés ensemble', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(new Date(2026, 9, 15, 21).getTime())
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')

    horloge.regler(new Date(2026, 6, 3, 20).getTime())
    await partie(services, [kevin.id], [RIEN])
    horloge.regler(new Date(2026, 9, 15, 20).getTime())
    await partie(services, [kevin.id], [S20])
    await partie(services, [kevin.id], [[Dart.single(20), Dart.single(20), Dart.miss()]])
    horloge.regler(new Date(2026, 9, 15, 21).getTime())
    renderWithServices(<App />, { services, route: '/statistiques' })

    const ligne = () => screen.findByText('Hors cible par partie').then((l) => l.closest('p'))
    await utilisateur.click(screen.getByRole('button', { name: 'Tout' }))
    await waitFor(async () =>
      expect((await ligne())?.textContent).toBe('Hors cible par partie1,3sur 3 parties'),
    )
    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    await waitFor(async () =>
      expect((await ligne())?.textContent).toBe('Hors cible par partie0,5sur 2 parties'),
    )
  })

  it('à l’ouverture, montre le dernier joueur consulté', async () => {
    const { services, dependencies, julien } = await troisJoueurs()
    dependencies.devices.preferences.write(CLE, julien.id)
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect((await cible()).getAttribute('aria-label')).toMatch(/^Julien :/)
    expect(within(ruban()).getByRole('button', { name: 'Julien' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('repli sur le premier de la moyenne si le profil mémorisé a été supprimé', async () => {
    const { services, dependencies, julien } = await troisJoueurs()
    dependencies.devices.preferences.write(CLE, julien.id)
    await services.managePlayers.remove(julien.id)
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect((await cible()).getAttribute('aria-label')).toMatch(/^Kevin :/)
    expect(within(ruban()).getByRole('button', { name: 'Joueur supprimé' })).toBeInTheDocument()
  })

  it('repli si le joueur mémorisé n’a aucune fléchette sur la période, sans oublier la préférence', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(new Date(2026, 9, 15, 21).getTime())
    const { services, dependencies } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')
    const sarah = await services.managePlayers.create('Sarah')

    horloge.regler(new Date(2026, 6, 3, 20).getTime())
    await partie(services, [sarah.id], [S20])
    horloge.regler(new Date(2026, 9, 15, 20).getTime())
    await partie(services, [kevin.id, sarah.id], [S20])
    horloge.regler(new Date(2026, 9, 15, 21).getTime())

    dependencies.devices.preferences.write(CLE, sarah.id)
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect((await cible()).getAttribute('aria-label')).toMatch(/^Sarah :/)

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    await waitFor(async () =>
      expect((await cible()).getAttribute('aria-label')).toMatch(/^Kevin :/),
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Tout' }))
    await waitFor(async () =>
      expect((await cible()).getAttribute('aria-label')).toMatch(/^Sarah :/),
    )
    expect(dependencies.devices.preferences.read(CLE, null)).toBe(sarah.id)
  })

  it('un appui change la cible et ses cases, mémorise le joueur, et ne touche pas aux cartes', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, sarah } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    const plateau = await cible()
    const cases = () =>
      within(plateau.closest('figure') as HTMLElement)
        .getAllByRole('listitem')
        .map((c) => c.textContent)
    expect(cases()).toEqual(['S209 fois', '0hors cible'])
    const cartes = () =>
      ['Moyenne 3 fl., Moyenne 3 fléchettes', 'Victoires', 'Grosses volées', 'Finitions'].map(
        (nom) => screen.getByRole('region', { name: nom }).textContent,
      )
    const avant = cartes()

    expect(dependencies.devices.preferences.read(CLE, null)).toBeNull()

    await utilisateur.click(within(ruban()).getByRole('button', { name: 'Sarah' }))

    const apres = await cible()
    expect(apres.getAttribute('aria-label')).toMatch(/^Sarah : S5 3 fois/)
    expect(
      within(apres.closest('figure') as HTMLElement)
        .getAllByRole('listitem')
        .map((c) => c.textContent),
    ).toEqual(['S53 fois', '0hors cible'])
    expect(within(ruban()).getByRole('button', { name: 'Sarah' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(cartes()).toEqual(avant)
    expect(dependencies.devices.preferences.read(CLE, null)).toBe(sarah.id)
  })

  it('un seul joueur : pas de sélecteur', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await partie(services, [kevin.id], [S20])
    renderWithServices(<App />, { services, route: '/statistiques' })

    await cible()
    expect(screen.queryByRole('group', { name: 'Joueur' })).toBeNull()
  })

  it('les cases de la bulle se disent en toutes lettres, et moins de trois zones donnent moins de cases', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await partie(services, [kevin.id], [[Dart.bullseye(), Dart.bullseye(), Dart.bull()]])
    renderWithServices(<App />, { services, route: '/statistiques' })

    const plateau = await cible()
    const cases = within(plateau.closest('figure') as HTMLElement)
      .getAllByRole('listitem')
      .map((c) => c.textContent)
    expect(cases).toEqual(['Bulle 502 fois', 'Bulle 251 fois', '0hors cible'])
  })
})

describe('Statistiques — les cartes du podium', () => {
  it('chaque carte est une région nommée par son titre', async () => {
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    for (const nom of [
      'Moyenne 3 fl., Moyenne 3 fléchettes',
      'Victoires',
      'Grosses volées',
      'Finitions',
    ]) {
      const region = await screen.findByRole('region', { name: nom })
      expect(within(region).getByRole('heading', { level: 2, name: nom })).toBeInTheDocument()
      const dessins = [...region.querySelectorAll('svg')]
      expect(dessins.length).toBeGreaterThan(0)
      for (const svg of dessins) expect(svg.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('la bascule de Moyenne reclasse la carte et change son titre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(ordre(moyenne)).toEqual(['Kevin', 'Julien', 'Sarah'])
    expect(within(moyenne).getByRole('button', { name: 'Moy., Moyenne' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await utilisateur.click(within(moyenne).getByRole('button', { name: 'Volée, Meilleure volée' }))
    const volee = screen.getByRole('region', { name: 'Meilleure volée' })
    expect(ordre(volee)).toEqual(['Julien', 'Kevin', 'Sarah'])
    expect(screen.queryByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' })).toBeNull()

    await utilisateur.click(within(volee).getByRole('button', { name: 'F9, First 9' }))
    const first9 = screen.getByRole('region', { name: 'First 9' })
    expect(ordre(first9)).toEqual(['Kevin', 'Julien', 'Sarah'])
    expect(first9).toHaveTextContent('33,3')
  })

  it('les bascules affichent un libellé court, et gardent leur nom complet', async () => {
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    const bascules = within(
      within(moyenne).getByRole('group', { name: 'Classer la moyenne par' }),
    ).getAllByRole('button')
    expect(bascules.map((b) => b.textContent)).toEqual(['Moy.', 'F9', 'Volée'])
    expect(bascules.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Moy., Moyenne',
      'F9, First 9',
      'Volée, Meilleure volée',
    ])

    const finitions = screen.getByRole('region', { name: 'Finitions' })
    const autres = within(
      within(finitions).getByRole('group', { name: 'Classer les finitions par' }),
    ).getAllByRole('button')
    expect(autres.map((b) => b.textContent)).toEqual(['% dbl', 'Haut', 'Manche'])
    expect(autres.map((b) => b.getAttribute('aria-label'))).toEqual([
      '% dbl, % doubles',
      'Haut, Plus haut finish',
      'Manche, Manche la plus courte',
    ])
  })

  it('Finitions : « Plus haut » en décroissant, « Manche » en croissant, sans ligne de bas', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const sarah = await services.managePlayers.create('Sarah')
    await partie(
      services,
      [kevin.id],
      [[Dart.single(20), Dart.double(20)]],
      X01Config.create({ startingScore: 60, legsToWin: 1 }),
    )
    await partie(
      services,
      [sarah.id],
      [[Dart.double(20)]],
      X01Config.create({ startingScore: 40, legsToWin: 1 }),
    )
    renderWithServices(<App />, { services, route: '/statistiques' })

    const finitions = await screen.findByRole('region', { name: 'Finitions' })

    await utilisateur.click(
      within(finitions).getByRole('button', { name: 'Haut, Plus haut finish' }),
    )
    expect(ordre(finitions)).toEqual(['Kevin', 'Sarah'])
    expect(within(finitions).getAllByText('60').length).toBeGreaterThan(0)
    expect(finitions).not.toHaveTextContent('Plus haut finish :')
    expect(finitions).not.toHaveTextContent('Manche la plus courte :')

    await utilisateur.click(
      within(finitions).getByRole('button', { name: 'Manche, Manche la plus courte' }),
    )
    expect(ordre(finitions)).toEqual(['Sarah', 'Kevin'])
    expect(within(finitions).getByText('fl.')).toBeInTheDocument()
  })

  it('les bascules reviennent au premier choix à chaque ouverture', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await troisJoueurs()
    const premier = renderWithServices(<App />, { services, route: '/statistiques' })

    await utilisateur.click(
      within(
        await screen.findByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' }),
      ).getByRole('button', {
        name: 'F9, First 9',
      }),
    )
    expect(screen.getByRole('region', { name: 'First 9' })).toBeInTheDocument()
    premier.unmount()

    renderWithServices(<App />, { services, route: '/statistiques' })
    expect(
      await screen.findByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' }),
    ).toBeInTheDocument()
  })

  it('Victoires : « v / j » sur chaque ligne, sans manches (Révision 1)', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const config = X01Config.create({ startingScore: 40, legsToWin: 1 })
    await partie(services, [kevin.id, julien.id], [[Dart.double(20)]], config)
    await partie(services, [julien.id, kevin.id], [RIEN, [Dart.double(20)]], config)

    renderWithServices(<App />, { services, route: '/statistiques' })

    const victoires = await screen.findByRole('region', { name: 'Victoires' })
    expect(valeursDe(victoires)).toEqual([
      ['Kevin', '2', '/ 2'],
      ['Julien', '0', '/ 2'],
    ])
    expect(victoires).not.toHaveTextContent(/manche/i)
    expect(victoires).not.toHaveTextContent('%')
  })

  it('Grosses volées : une rangée par seuil, le nom dit au lecteur d’écran, « — » sans volée', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await partie(
      services,
      [kevin.id],
      [
        [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
        [Dart.triple(20), Dart.triple(20), Dart.single(20)],
      ],
    )
    renderWithServices(<App />, { services, route: '/statistiques' })

    const grosses = await screen.findByRole('region', { name: 'Grosses volées' })
    expect(within(grosses).getByText('Kevin')).toHaveClass('sr-only')
    const rangees = within(grosses)
      .getAllByRole('term')
      .map((dt) => `${dt.textContent} ${dt.nextElementSibling?.textContent}`)
    expect(rangees).toEqual(['180 1', '140+ 2', '100+ 2'])

    const teintes = within(grosses)
      .getAllByRole('term')
      .map((dt) => dt.nextElementSibling?.querySelector('svg')?.parentElement?.className)
    expect(teintes).toEqual(['text-laiton', 'text-craie', 'text-craie-2'])
  })

  it('Grosses volées : classées sur le seuil de la bascule, 180 au départ (Révision 1)', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const sarah = await services.managePlayers.create('Sarah')
    const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
    const CENT = [Dart.triple(20), Dart.single(20), Dart.single(20)]
    await partie(services, [kevin.id], [T20])
    await partie(services, [sarah.id], [CENT, CENT, CENT])
    renderWithServices(<App />, { services, route: '/statistiques' })

    const grosses = await screen.findByRole('region', { name: 'Grosses volées' })
    const noms = () => [...grosses.querySelectorAll('.sr-only')].map((n) => n.textContent)
    expect(within(grosses).getByRole('button', { name: '180' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(noms()).toEqual(['Kevin', 'Sarah'])

    await utilisateur.click(within(grosses).getByRole('button', { name: '100+' }))
    expect(noms()).toEqual(['Sarah', 'Kevin'])

    await utilisateur.click(screen.getByRole('button', { name: '7 jours' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Tout' }))
    const apres = await screen.findByRole('region', { name: 'Grosses volées' })
    expect(within(apres).getByRole('button', { name: '100+' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('les pistes de barre sont muettes dans chaque carte classée (T-M1)', async () => {
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    for (const nom of ['Moyenne 3 fl., Moyenne 3 fléchettes', 'Victoires', 'Finitions']) {
      const region = await screen.findByRole('region', { name: nom })
      const lignes = within(region).getAllByRole('listitem')
      expect(lignes).toHaveLength(3)
      const pistes = [...region.querySelectorAll('ol li > span:nth-child(3)')]
      expect(pistes).toHaveLength(3)
      for (const piste of pistes) expect(piste).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('U9 : Victoires classe sur les victoires, pas sur la moyenne, et « / N » est au premier', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const config = X01Config.create({ startingScore: 40, legsToWin: 1 })
    await partie(services, [kevin.id, julien.id], [RIEN, RIEN, RIEN, [Dart.double(20)]], config)
    await partie(services, [kevin.id, julien.id], [RIEN, RIEN, RIEN, [Dart.double(20)]], config)
    await partie(
      services,
      [kevin.id],
      [
        [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
        [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
      ],
    )
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(ordre(moyenne)).toEqual(['Kevin', 'Julien'])

    const victoires = screen.getByRole('region', { name: 'Victoires' })
    expect(ordre(victoires)).toEqual(['Julien', 'Kevin'])
    expect(valeursDe(victoires)).toEqual([
      ['Julien', '2', '/ 2'],
      ['Kevin', '0', '/ 3'],
    ])
    const grande = within(victoires).getAllByText('/ 2')[0]
    expect(grande?.closest('p')).toHaveTextContent('Julien')
  })

  it('la bascule survit au changement de période (T-M4)', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    await utilisateur.click(
      within(
        await screen.findByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' }),
      ).getByRole('button', {
        name: 'F9, First 9',
      }),
    )
    await utilisateur.click(screen.getByRole('button', { name: '7 jours' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Tout' }))
    expect(await screen.findByRole('region', { name: 'First 9' })).toBeInTheDocument()
  })

  it('Q1 : un « 0 % » devant des « — » n’est pas doré, et le grand chiffre reste en craie', async () => {
    const { services } = fakeServices()
    const julien = await services.managePlayers.create('Julien')
    const david = await services.managePlayers.create('David')
    await partie(
      services,
      [julien.id],
      [RIEN],
      X01Config.create({ startingScore: 40, legsToWin: 1 }),
    )
    await partie(services, [david.id], [S20])
    renderWithServices(<App />, { services, route: '/statistiques' })

    const finitions = await screen.findByRole('region', { name: 'Finitions' })
    expect(within(finitions).getAllByText('0 %')).toHaveLength(2)
    expect(finitions.querySelectorAll('ol li > span[aria-hidden] > span')).toHaveLength(2)
    expect(finitions.querySelectorAll('.bg-laiton')).toHaveLength(0)
    expect(within(finitions).getAllByText('0 %')[0]).toHaveClass('text-craie-vive')
    const ligneDavid = within(finitions)
      .getAllByRole('listitem')
      .find((li) => within(li).queryByText('David')) as HTMLElement
    expect(within(ligneDavid).getByText('—')).toHaveClass('text-craie-3')
  })
})

describe('Statistiques — cas de bord à l’écran (T-M6)', () => {
  it('le sous-titre compte les fléchettes de la période', async () => {
    const { services } = await troisJoueurs()
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect(
      await screen.findByText('24 fléchettes lancées · toutes parties confondues'),
    ).toBeInTheDocument()
  })

  it.each([42, { id: 'x' }, ['x'], true])(
    'une préférence corrompue (%j) retombe sur le premier de la moyenne',
    async (corrompue) => {
      const { services, dependencies } = await troisJoueurs()
      dependencies.devices.preferences.write(CLE, corrompue)
      renderWithServices(<App />, { services, route: '/statistiques' })

      expect((await cible()).getAttribute('aria-label')).toMatch(/^Kevin :/)
    },
  )

  it('U8g : un appui sur un joueur supprimé montre sa cible quand même', async () => {
    const utilisateur = userEvent.setup()
    const { services, julien } = await troisJoueurs()
    await services.managePlayers.remove(julien.id)
    renderWithServices(<App />, { services, route: '/statistiques' })

    await cible()
    await utilisateur.click(within(ruban()).getByRole('button', { name: 'Joueur supprimé' }))
    expect((await cible()).getAttribute('aria-label')).toMatch(/^Joueur supprimé :/)
  })

  it('U8g : un appui sur un joueur sans fléchette montre une cible vide', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const sarah = await services.managePlayers.create('Sarah')
    await partie(services, [kevin.id, sarah.id], [S20])
    renderWithServices(<App />, { services, route: '/statistiques' })

    await cible()
    await utilisateur.click(within(ruban()).getByRole('button', { name: 'Sarah' }))
    const vide = await screen.findByRole('img', {
      name: 'Sarah : aucune fléchette sur la période',
    })
    const cases = within(vide.closest('figure') as HTMLElement)
      .getAllByRole('listitem')
      .map((c) => c.textContent)
    expect(cases).toEqual(['0hors cible'])
  })
})

const bande = async (ks: readonly number[]) => {
  const { services, dependencies } = fakeServices()
  for (const [rang, k] of ks.entries()) {
    const joueur = await services.managePlayers.create(`J${rang + 1}`)
    const s = Dart.single(k as Parameters<typeof Dart.single>[0])
    await partie(services, [joueur.id], [[s, s, s]])
  }
  return { services, dependencies }
}

const nomsDe = (racine: HTMLElement) =>
  within(racine)
    .getAllByRole('listitem')
    .map((li) => li.children[1]?.textContent)

const toutVoir = (region: HTMLElement) =>
  within(region).queryByRole('button', { name: /^Tout voir, / })

const SEPT = [20, 19, 18, 17, 16, 15, 14]

describe('Statistiques — N premiers, puis « Tout voir » (Révision 1)', () => {
  it('7 joueurs : 5 lignes et « Tout voir » sur trois cartes, 3 joueurs dans Grosses volées', async () => {
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(nomsDe(moyenne)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5'])
    for (const nom of ['Moyenne 3 fl., Moyenne 3 fléchettes', 'Victoires', 'Finitions']) {
      const region = screen.getByRole('region', { name: nom })
      expect(within(region).getAllByRole('listitem')).toHaveLength(5)
      const bouton = toutVoir(region)
      expect(bouton).toHaveAccessibleName(`Tout voir, ${nom}`)
      expect(bouton).toHaveAttribute('aria-haspopup', 'dialog')
      expect(bouton).toHaveTextContent('Tout voir')
    }
    const grosses = screen.getByRole('region', { name: 'Grosses volées' })
    expect(grosses.querySelectorAll('.sr-only')).toHaveLength(3)
    expect(toutVoir(grosses)).not.toBeNull()
  })

  it('6 joueurs : tout est montré, sauf Grosses volées', async () => {
    const { services } = await bande(SEPT.slice(0, 6))
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(within(moyenne).getAllByRole('listitem')).toHaveLength(6)
    for (const nom of ['Moyenne 3 fl., Moyenne 3 fléchettes', 'Victoires', 'Finitions']) {
      expect(toutVoir(screen.getByRole('region', { name: nom }))).toBeNull()
    }
    expect(toutVoir(screen.getByRole('region', { name: 'Grosses volées' }))).not.toBeNull()
  })

  it('4 joueurs : aucun « Tout voir »', async () => {
    const { services } = await bande(SEPT.slice(0, 4))
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(within(moyenne).getAllByRole('listitem')).toHaveLength(4)
    expect(
      screen.getByRole('region', { name: 'Grosses volées' }).querySelectorAll('.sr-only'),
    ).toHaveLength(4)
    expect(screen.queryAllByRole('button', { name: /^Tout voir, / })).toHaveLength(0)
  })

  it('deux ex aequo à la coupure : 6 lignes ; trois : coupe net à 5', async () => {
    const deux = await bande([20, 19, 18, 17, 16, 16, 10])
    const premier = renderWithServices(<App />, { services: deux.services, route: '/statistiques' })
    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(within(moyenne).getAllByRole('listitem')).toHaveLength(6)
    expect(toutVoir(moyenne)).not.toBeNull()
    premier.unmount()

    const trois = await bande([20, 19, 18, 17, 16, 16, 16])
    renderWithServices(<App />, { services: trois.services, route: '/statistiques' })
    const coupee = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(within(coupee).getAllByRole('listitem')).toHaveLength(5)
    expect(toutVoir(coupee)).not.toBeNull()
  })

  it('« Tout voir » ouvre un dialogue nommé : tous les joueurs, sans grande ligne, la teinte de la carte', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    expect(
      await screen.findByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()

    await utilisateur.click(
      screen.getByRole('button', { name: 'Tout voir, Moyenne 3 fl., Moyenne 3 fléchettes' }),
    )
    const dialogue = screen.getByRole('dialog', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' })
    expect(nomsDe(dialogue)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7'])
    expect(dialogue.querySelectorAll('.text-5xl')).toHaveLength(0)
    const premierRemplissage = dialogue.querySelector('ol li > span:nth-child(3) > span')
    expect(premierRemplissage).toHaveClass('bg-laiton')
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
  })

  it('les bascules sont partagées : changées dans le dialogue, la carte suit', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Tout voir, Moyenne 3 fl., Moyenne 3 fléchettes' }),
    )
    const dialogue = screen.getByRole('dialog', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' })
    await utilisateur.click(within(dialogue).getByRole('button', { name: 'F9, First 9' }))
    expect(screen.getByRole('dialog', { name: 'First 9' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'First 9' })).toBeInTheDocument()
  })

  it('le retour du téléphone ferme le dialogue sans quitter l’écran : bascule, cible, période intactes', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    await utilisateur.click(within(moyenne).getByRole('button', { name: 'F9, First 9' }))
    await utilisateur.click(within(ruban()).getByRole('button', { name: 'J3' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Tout voir, First 9' }))
    expect(screen.getByRole('dialog', { name: 'First 9' })).toBeInTheDocument()

    await retourTelephone()

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Statistiques' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'First 9' })).toBeInTheDocument()
    expect((await cible()).getAttribute('aria-label')).toMatch(/^J3 :/)
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un appui sur le voile ferme le dialogue, sur Statistiques, en un seul recul', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/' })

    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' })
    await utilisateur.click(within(navigation).getByRole('link', { name: 'Stats' }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Tout voir, Victoires' }))
    const dialogue = screen.getByRole('dialog', { name: 'Victoires' })
    dialogue.getBoundingClientRect = () => new DOMRect(16, 100, 358, 400)

    const liste = within(dialogue).getAllByRole('listitem')[0] as HTMLElement
    fireEvent.pointerDown(liste, { clientX: 100, clientY: 200 })
    fireEvent.click(liste, { clientX: 100, clientY: 200 })
    expect(screen.getByRole('dialog', { name: 'Victoires' })).toBeInTheDocument()

    fireEvent.pointerDown(dialogue, { clientX: 100, clientY: 40 })
    fireEvent.click(dialogue, { clientX: 100, clientY: 40 })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('heading', { level: 1, name: 'Statistiques' })).toBeInTheDocument()

    await retourTelephone()
    await waitFor(() =>
      expect(screen.queryByRole('heading', { level: 1, name: 'Statistiques' })).toBeNull(),
    )
  })

  it.each(['✕', 'Échap'])(
    'Accueil → Stats → « Tout voir » → %s → retour : on revient à l’Accueil, sans entrée orpheline',
    async (geste) => {
      const utilisateur = userEvent.setup()
      const { services } = await bande(SEPT)
      renderWithServices(<App />, { services, route: '/' })

      const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' })
      await utilisateur.click(within(navigation).getByRole('link', { name: 'Stats' }))
      const bouton = await screen.findByRole('button', { name: 'Tout voir, Victoires' })
      await utilisateur.click(bouton)
      const dialogue = screen.getByRole('dialog', { name: 'Victoires' })

      if (geste === '✕') {
        await utilisateur.click(within(dialogue).getByRole('button', { name: 'Fermer' }))
      } else {
        fireEvent(dialogue, new Event('cancel', { cancelable: true }))
      }

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(screen.getByRole('heading', { level: 1, name: 'Statistiques' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tout voir, Victoires' })).toHaveFocus()

      await retourTelephone()
      await waitFor(() =>
        expect(screen.queryByRole('heading', { level: 1, name: 'Statistiques' })).toBeNull(),
      )
    },
  )
})

describe('Statistiques — Révision 1, rejeu Test (QO-1, TM-5, TM-6)', () => {
  it('QO-1 : « Moyenne 3 fl. » à l’écran, nommé « Moyenne 3 fl., Moyenne 3 fléchettes »', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    const nom = 'Moyenne 3 fl., Moyenne 3 fléchettes'
    const region = await screen.findByRole('region', { name: nom })
    const titre = within(region).getByRole('heading', { level: 2, name: nom })
    expect(titre).toHaveTextContent(/^Moyenne 3 fl\.$/)

    const bouton = within(region).getByRole('button', { name: `Tout voir, ${nom}` })
    await utilisateur.click(bouton)
    const dialogue = screen.getByRole('dialog', { name: nom })
    expect(within(dialogue).getByRole('heading', { level: 2 })).toHaveTextContent(
      /^Moyenne 3 fl\.$/,
    )

    await utilisateur.click(within(dialogue).getByRole('button', { name: 'F9, First 9' }))
    expect(screen.getByRole('dialog', { name: 'First 9' })).toBeInTheDocument()
  })

  it('TM-5 : le modal Victoires porte « / j » sur chaque ligne', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    renderWithServices(<App />, { services, route: '/statistiques' })

    await utilisateur.click(await screen.findByRole('button', { name: 'Tout voir, Victoires' }))
    const dialogue = screen.getByRole('dialog', { name: 'Victoires' })
    const lignes = valeursDe(dialogue)
    expect(lignes).toHaveLength(7)
    for (const [, valeur, complement] of lignes) {
      expect(valeur).toBe('0')
      expect(complement).toBe('/ 1')
    }
  })

  const inverses = async () => {
    const { services } = fakeServices()
    const CENT = [Dart.triple(20), Dart.single(20), Dart.single(20)]
    const blanches = [0, 1, 3, 7, 16]
    for (let i = 0; i < 5; i++) {
      const joueur = await services.managePlayers.create(`P${i + 1}`)
      const volees =
        i === 0
          ? [S20]
          : [
              ...Array.from({ length: i }, () => CENT),
              ...Array.from({ length: blanches[i] ?? 0 }, () => RIEN),
            ]
      await partie(services, [joueur.id], volees)
    }
    return services
  }

  const nomsGrosses = (racine: HTMLElement) =>
    [...racine.querySelectorAll('.sr-only')].map((n) => n.textContent)

  it('TM-6 : Grosses volées sur 100+ — la carte coupe à 3 et le modal classe tout le monde sur le seuil', async () => {
    const utilisateur = userEvent.setup()
    const services = await inverses()
    renderWithServices(<App />, { services, route: '/statistiques' })

    const moyenne = await screen.findByRole('region', {
      name: 'Moyenne 3 fl., Moyenne 3 fléchettes',
    })
    expect(nomsDe(moyenne).slice(0, 3)).toEqual(['P1', 'P2', 'P3'])

    const grosses = screen.getByRole('region', { name: 'Grosses volées' })
    await utilisateur.click(within(grosses).getByRole('button', { name: '100+' }))
    expect(nomsGrosses(grosses)).toEqual(['P5', 'P4', 'P3'])

    await utilisateur.click(
      within(grosses).getByRole('button', { name: 'Tout voir, Grosses volées' }),
    )
    const dialogue = screen.getByRole('dialog', { name: 'Grosses volées' })
    expect(nomsGrosses(dialogue)).toEqual(['P5', 'P4', 'P3', 'P2', 'P1'])
  })
})

describe('Statistiques — l’onglet actif ramené dans le ruban (constat 3)', () => {
  const simulerMiseEnPage = () => {
    const proto = HTMLElement.prototype
    const origines = ['offsetLeft', 'offsetWidth', 'clientWidth', 'scrollLeft'].map(
      (cle) =>
        [
          cle,
          Object.getOwnPropertyDescriptor(proto, cle) ??
            Object.getOwnPropertyDescriptor(Element.prototype, cle),
        ] as const,
    )
    const ecritures: { readonly element: HTMLElement; readonly valeur: number }[] = []
    Object.defineProperty(proto, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        const parent = this.parentElement
        return parent ? [...parent.children].indexOf(this) * 100 : 0
      },
    })
    Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => 100 })
    Object.defineProperty(proto, 'clientWidth', { configurable: true, get: () => 300 })
    const positions = new WeakMap<HTMLElement, number>()
    Object.defineProperty(proto, 'scrollLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return positions.get(this) ?? 0
      },
      set(this: HTMLElement, valeur: number) {
        positions.set(this, valeur)
        ecritures.push({ element: this, valeur })
      },
    })
    const restaurer = () => {
      for (const [cle, descripteur] of origines) {
        if (descripteur) Object.defineProperty(proto, cle, descripteur)
        else Reflect.deleteProperty(proto, cle)
      }
    }
    return { ecritures, restaurer }
  }

  it('à l’ouverture, le joueur mémorisé en fin de ruban est ramené dans la vue', async () => {
    const { services, dependencies } = await bande(SEPT)
    const joueurs = await services.managePlayers.listAll()
    const dernier = joueurs.find((j) => j.name === 'J7')
    dependencies.devices.preferences.write(CLE, dernier?.id)

    const { ecritures, restaurer } = simulerMiseEnPage()
    try {
      renderWithServices(<App />, { services, route: '/statistiques' })
      await waitFor(() => expect(ecritures.length).toBeGreaterThan(0))
      const derniere = ecritures.at(-1)
      expect(derniere?.valeur).toBe(400)
      expect(derniere?.element.querySelector('button[aria-pressed="true"]')).toHaveTextContent('J7')
      expect(ecritures.every((e) => e.element.closest('fieldset'))).toBe(true)
    } finally {
      restaurer()
    }
  })

  it('à l’appui sur un onglet hors de la vue, le ruban le ramène', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await bande(SEPT)
    const { ecritures, restaurer } = simulerMiseEnPage()
    try {
      renderWithServices(<App />, { services, route: '/statistiques' })
      await cible()
      expect(ecritures).toHaveLength(0)
      await utilisateur.click(within(ruban()).getByRole('button', { name: 'J5' }))
      expect(ecritures.at(-1)?.valeur).toBe(200)
    } finally {
      restaurer()
    }
  })
  it('au changement de période, même joueur actif mais liste réordonnée : le ruban recadre (constat 11)', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(new Date(2026, 9, 16, 21).getTime())
    const { services, dependencies } = fakeServices({ clock: horloge })

    const j7 = await services.managePlayers.create('J7')
    horloge.regler(new Date(2026, 6, 3, 20).getTime())
    const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
    await partie(services, [j7.id], [T20, T20])
    horloge.regler(new Date(2026, 9, 16, 20).getTime())
    const S1 = Dart.single(1)
    await partie(services, [j7.id], [[S1, S1, S1]])
    for (let i = 1; i <= 6; i++) {
      const joueur = await services.managePlayers.create(`J${i}`)
      const s = Dart.single((21 - i) as Parameters<typeof Dart.single>[0])
      await partie(services, [joueur.id], [[s, s, s]])
    }
    horloge.regler(new Date(2026, 9, 16, 21).getTime())
    dependencies.devices.preferences.write(CLE, j7.id)

    const { ecritures, restaurer } = simulerMiseEnPage()
    try {
      renderWithServices(<App />, { services, route: '/statistiques' })
      expect((await cible()).getAttribute('aria-label')).toMatch(/^J7 :/)
      expect(ecritures).toHaveLength(0)

      await utilisateur.click(screen.getByRole('button', { name: '7 jours' }))
      await waitFor(() => expect(ecritures.at(-1)?.valeur).toBe(400))
      const rubanSeptJours = ecritures.at(-1)?.element
      const avant = ecritures.length

      await utilisateur.click(screen.getByRole('button', { name: 'Tout' }))
      await waitFor(() => expect(ecritures.length).toBeGreaterThan(avant))
      expect(ecritures.at(-1)?.valeur).toBe(0)
      expect(ecritures.at(-1)?.element).toBe(rubanSeptJours)
      expect(within(ruban()).getByRole('button', { name: 'J7' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    } finally {
      restaurer()
    }
  })
})
