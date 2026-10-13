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
  return [document.body.textContent ?? '', ...attributs].join(' ')
}

/** Témoin positif d'abord : un test d'absence doit pouvoir échouer. */
const sansLeg = () => {
  const texte = texteAffiche()
  expect(texte).toMatch(/manche/i)
  expect(texte).not.toMatch(LEG)
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
    expect(screen.getByText('1 manche jouée')).toBeInTheDocument()
    sansLeg()
  })

  it('dans l’historique', async () => {
    const { services } = fakeServices()
    await partieASets(services)

    renderWithServices(<App />, { services, route: '/historique' })
    await screen.findAllByRole('listitem')
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
    await screen.findByRole('table', { name: 'Manches' })
    await waitFor(() => expect(screen.getByText('Meilleure manche')).toBeInTheDocument())
    sansLeg()
  })
})
