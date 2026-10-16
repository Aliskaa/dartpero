import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import type { Announcer } from '@/core/application/ports/driven/Announcer'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { libelleFormat, libelleLegs, libelleLegsCourt, libelleMancheEnCours } from '@/ui/labels'
import { fakeDependencies, fakeServices } from '../fakes'
import { flechette } from './gestes'
import { renderWithServices } from './renderWithServices'

/** « leg » ou « legs », mot entier, quelle que soit la casse. */
const LEG = /\blegs?\b/i

/**
 * Tout ce qu'un joueur lit ou entend d'un écran : le texte, mais aussi les noms
 * accessibles (`aria-label`) et les infobulles (`title`).
 */
const texteAffiche = (): string => {
  const attributs = [...document.body.querySelectorAll('[aria-label], [title]')].flatMap(
    (element) => [element.getAttribute('aria-label') ?? '', element.getAttribute('title') ?? ''],
  )
  // Un nœud de texte après l'autre, séparés d'une espace : `textContent` colle les éléments
  // voisins (« legCommencer ») et `\b` ne verrait plus la fin du mot.
  const noeuds: string[] = []
  const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let noeud = parcours.nextNode(); noeud; noeud = parcours.nextNode()) {
    noeuds.push(noeud.textContent ?? '')
  }
  return [...noeuds, ...attributs].join(' ')
}

/** Témoin positif d'abord : un test d'absence doit pouvoir échouer. */
const sansLeg = (temoin: RegExp = /manche/i) => {
  const texte = texteAffiche()
  expect(texte).toMatch(temoin)
  expect(texte).not.toMatch(LEG)
  expect(texte).not.toMatch(/best of/i)
}

const avecVoix = () => {
  const dites: string[] = []
  const announcer: Announcer = { say: (texte) => dites.push(texte), cancel: () => {} }
  const base = fakeDependencies()
  return { dites, services: createServices({ ...base, devices: { ...base.devices, announcer } }) }
}

/** Une partie à sets : Kevin et Julien, 40 à faire, premier à 2 manches, 2 sets. */
const partieASets = async (services: Services) => {
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create({ startingScore: 40, legsToWin: 2, setsToWin: 2 }),
  })
  return { kevin, julien, matchId }
}

describe('« Manche » à l’écran, jamais « leg »', () => {
  it('écrit « manche » dans les libellés du format', () => {
    expect(libelleLegs(1)).toBe('1 manche')
    expect(libelleLegs(3)).toBe('premier à 3 manches')
    expect(libelleLegsCourt(1)).toBe('1 manche')
    expect(libelleLegsCourt(2)).toBe('premier à 2')
    expect(libelleFormat(2, 1)).toBe('premier à 2 manches')
    expect(libelleFormat(3, 2)).toBe('premier à 2 sets · premier à 3 manches par set')
    expect(libelleMancheEnCours(2)).toBe('Manche 2')
  })

  it('à l’étape 2 du X01', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })

    await screen.findByRole('group', { name: 'Manches à gagner' })
    sansLeg()
  })

  /** Chaque page de « Nouvelle partie », tout déplié : ni « leg » ni « best of », à l'œil comme au lecteur d'écran. */
  it('à l’étape 1 de Nouvelle partie', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    await screen.findAllByRole('link')
    // Témoin positif : les tuiles sont bien là (le X01 se dit « zéro pile »).
    sansLeg(/zéro pile/i)
  })

  it.each([
    ['x01', /manche/i],
    ['cricket', /Cut-throat/],
    ['tour-du-monde', /21 cibles/],
    ['entrainement', /sorties/i],
  ] as const)('à l’étape 2, tout déplié, pour %s', async (slug, temoin) => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: `/nouvelle-partie/${slug}` })

    await screen.findByRole('region', { name: 'Réglages du jeu' })
    const plus = screen.queryByRole('button', { name: /plus de réglages/i })
    if (plus) await utilisateur.click(plus)
    await utilisateur.click(screen.getByRole('button', { name: 'Les règles en entier' }))
    // Rien ne reste replié : la preuve que le dépliage a eu lieu.
    for (const pli of screen.getAllByRole('button', { expanded: false })) {
      expect(pli).not.toHaveAccessibleName(/plus de réglages|les règles en entier/i)
    }
    sansLeg(temoin)
  })

  it('à l’étape Ordre de jeu', async () => {
    const { services, dependencies } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    dependencies.devices.preferences.write('partie:joueurs', [kevin.id, julien.id])
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01/ordre' })

    await screen.findByRole('list', { name: 'Ordre de passage' })
    // Témoin positif : la feuille d'ordre est affichée (« Tirer au sort »).
    sansLeg(/tirer au sort/i)
  })

  it('en partie à sets, après une manche gagnée — à l’écran comme à la voix', async () => {
    const utilisateur = userEvent.setup()
    const { dites, services } = avecVoix()
    const { matchId } = await partieASets(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Score restant de Kevin')

    await flechette(utilisateur, '20', 'Double') // Kevin sort : manche gagnée
    expect(await screen.findByText('Manche !')).toBeInTheDocument()
    expect(screen.getByText('Manche 2')).toBeInTheDocument()

    sansLeg()
    expect(dites.length).toBeGreaterThan(0)
    expect(dites.filter((phrase) => LEG.test(phrase))).toEqual([])
  })

  it('sur l’Accueil, avec une partie à sets en cours', async () => {
    const { services } = fakeServices()
    const { matchId } = await partieASets(services)
    await services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })

    renderWithServices(<App />, { services, route: '/' })
    await screen.findByRole('link', { name: /Reprendre/ })
    expect(screen.getByText(/manche 2/)).toBeInTheDocument()
    sansLeg()
  })

  it('dans l’historique', async () => {
    const { services } = fakeServices()
    await partieASets(services)

    renderWithServices(<App />, { services, route: '/historique' })
    const lignes = await screen.findAllByRole('listitem')
    // Seule partie, non finie : c'est la partie en cours, et sa ligne le dit.
    expect(lignes).toHaveLength(1)
    expect(lignes[0]).toHaveTextContent('En cours')
    sansLeg()
  })

  it('au résumé et dans les statistiques', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })

    const resume = renderWithServices(<App />, {
      services,
      route: `/partie/${matchId}/resume`,
    })
    await screen.findByText('Vainqueur')
    sansLeg()
    resume.unmount()

    renderWithServices(<App />, { services, route: '/statistiques' })
    // Révision 1 : les manches ont quitté Victoires ; la meilleure manche reste
    // dans la bascule « Manche » de Finitions — le témoin de `sansLeg`.
    const finitions = await screen.findByRole('region', { name: 'Finitions' })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Manche, Manche la plus courte' }),
      ).toBeInTheDocument(),
    )
    expect(finitions).toHaveTextContent('Manche')
    sansLeg()
  })
})
