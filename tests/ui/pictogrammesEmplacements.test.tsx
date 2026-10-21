import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { GAME_MODE_IDS } from '@/core/domain/games'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { PICTOGRAMME_PAR_MODE } from '@/ui/composants/commun/Pictogramme'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'
import { TRACES_ATTENDUS } from './tracesPictogrammes'

const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })
const BOUCLAGE = [Dart.single(20), Dart.single(19), Dart.bull()]
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

const partie = async (services: Services) => {
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.playTourDuMonde.start({
    playerIds: [kevin.id, julien.id],
    config: COURT,
  })
  return matchId
}

const svgsDe = (largeur: number, racine: ParentNode = document) =>
  [...racine.querySelectorAll('svg')].filter((svg) => svg.getAttribute('width') === String(largeur))

describe('Pictogrammes — leurs emplacements', () => {
  it('étape 1 : un pictogramme de 40 px, décoratif, sur chacune des cinq cartes', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    const cartes = await screen.findAllByRole('link')
    expect(cartes).toHaveLength(5)
    const svgs = svgsDe(40)
    expect(svgs).toHaveLength(5)
    for (const svg of svgs) expect(svg.getAttribute('aria-hidden')).toBe('true')
    // Un par carte : le mode se reconnaît à sa forme.
    for (const carte of cartes) expect(svgsDe(40, carte)).toHaveLength(1)
    // Et c'est bien la forme du mode : pas une icône de même taille.
    expect(svgs.map((svg) => svg.innerHTML).sort()).toEqual(
      [
        TRACES_ATTENDUS.x01,
        TRACES_ATTENDUS.cricket,
        TRACES_ATTENDUS['tour-du-monde'],
        TRACES_ATTENDUS.killer,
        TRACES_ATTENDUS.entrainement,
      ].sort(),
    )
  })

  /**
   * Dette P3-1 du lot `pictogrammes` : la liste triée ci-dessus ne dit pas QUELLE
   * tuile porte QUEL tracé. L'association est écrite en dur, d'après la planche,
   * jamais dérivée de la table du code (ce serait un test qui se répond à lui-même).
   */
  it.each([
    ['X01', /^X01/, 'x01'],
    ['CRICKET', /^Cricket/, 'cricket'],
    ['TOUR_DU_MONDE', /^Tour du monde/, 'tour-du-monde'],
    ['CHECKOUT_PRACTICE', /^Entraînement/, 'entrainement'],
  ] as const)('étape 1 : la tuile %s porte le pictogramme %s', async (mode, nom, pictogramme) => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    const tuile = await screen.findByRole('link', { name: nom })
    const [svg] = svgsDe(40, tuile)
    expect(svg?.innerHTML).toBe(TRACES_ATTENDUS[pictogramme])
    expect(PICTOGRAMME_PAR_MODE[mode]).toBe(pictogramme)
  })

  it('associe un pictogramme distinct à chaque jeu', () => {
    const noms = GAME_MODE_IDS.map((mode) => PICTOGRAMME_PAR_MODE[mode])
    expect(new Set(noms).size).toBe(GAME_MODE_IDS.length)
  })

  it('statistiques : un pictogramme de 20 px, décoratif, en tête de chacune des quatre cartes', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: [Dart.triple(20), Dart.triple(20)] })

    renderWithServices(<App />, { services, route: '/statistiques' })

    const cartes = [
      await screen.findByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' }),
      screen.getByRole('region', { name: 'Victoires' }),
      screen.getByRole('region', { name: 'Grosses volées' }),
      screen.getByRole('region', { name: 'Finitions' }),
    ]
    const attendus = [
      TRACES_ATTENDUS.moyenne,
      TRACES_ATTENDUS.victoire,
      TRACES_ATTENDUS['grosses-volees'],
      TRACES_ATTENDUS.sortie,
    ]
    expect(svgsDe(20)).toHaveLength(4)
    cartes.forEach((carte, rang) => {
      const svgs = svgsDe(20, carte)
      expect(svgs).toHaveLength(1)
      expect(svgs[0]?.getAttribute('aria-hidden')).toBe('true')
      expect(svgs[0]?.innerHTML).toBe(attendus[rang])
    })
  })

  it('résumé avec vainqueur : la couronne fait 32 px et reste décorative', async () => {
    const { services } = fakeServices()
    const matchId = await partie(services)
    await services.playTourDuMonde.recordVisit(matchId, BOUCLAGE)
    await services.playTourDuMonde.recordVisit(matchId, RATE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    await screen.findByText('Vainqueur')
    const couronnes = svgsDe(32)
    expect(couronnes).toHaveLength(1)
    expect(couronnes[0]?.getAttribute('aria-hidden')).toBe('true')
    expect(couronnes[0]?.innerHTML).toBe(TRACES_ATTENDUS.victoire)
    expect(svgsDe(64)).toHaveLength(0)
  })

  it('résumé sans vainqueur : le « nul » fait 64 px, sans couronne', async () => {
    const { services } = fakeServices()
    const matchId = await partie(services)
    await services.playTourDuMonde.recordVisit(matchId, BOUCLAGE)
    await services.playTourDuMonde.recordVisit(matchId, BOUCLAGE)

    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    await screen.findByRole('heading', { name: 'Ex æquo' })
    const nuls = svgsDe(64)
    expect(nuls).toHaveLength(1)
    expect(nuls[0]?.getAttribute('aria-hidden')).toBe('true')
    expect(nuls[0]?.innerHTML).toBe(TRACES_ATTENDUS.nul)
    expect(svgsDe(32)).toHaveLength(0)
  })
})
