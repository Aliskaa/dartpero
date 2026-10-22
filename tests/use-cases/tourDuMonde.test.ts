import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/** Trois cibles : un tour se boucle en une volée. */
const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('PreviewTourDuMondeVisit (use case)', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
  })

  const demarrer = (): Promise<MatchId> =>
    services.playTourDuMonde.start({ playerIds: [kevin, julien], config: COURT })

  it('ne prévoit rien tant qu’aucune fléchette n’est plantée', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [] })

    expect(apercu.state).toBe(state)
    expect(apercu.complete).toBe(false)
  })

  it('laisse la volée ouverte tant que le parcours n’est pas bouclé', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [Dart.single(20)] })

    expect(apercu.complete).toBe(false)
    expect(apercu.state.players[0]?.targetIndex).toBe(1)
    expect(apercu.state.players[0]?.dartsThrown).toBe(1)
  })

  it('clôt la volée sur la fléchette qui boucle, alors que la partie continue', async () => {
    const id = await demarrer()
    await services.playTourDuMonde.recordVisit(id, [Dart.single(20), Dart.single(19), Dart.miss()])
    await services.playTourDuMonde.recordVisit(id, RATE)

    const state = await services.playTourDuMonde.getState(id)
    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [Dart.bull()] })

    expect(apercu.complete).toBe(true)
    // ⚠️ La partie n’est PAS finie : le tour de table n’est pas bouclé.
    expect(apercu.state.finished).toBe(false)
    expect(apercu.state.lastRound).toBe(true)
    expect(apercu.state.players[0]?.dartsThrown).toBe(4)
  })

  it('clôt la volée à trois fléchettes même sans bouclage', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: RATE })

    expect(apercu.complete).toBe(true)
    expect(apercu.state.players[0]?.targetIndex).toBe(0)
  })

  describe('completesTour (lot annulation-volee) : la fléchette à faire confirmer', () => {
    it('vrai sur la fléchette qui boucle le parcours', async () => {
      const id = await demarrer()
      await services.playTourDuMonde.recordVisit(id, [
        Dart.single(20),
        Dart.single(19),
        Dart.miss(),
      ])
      await services.playTourDuMonde.recordVisit(id, RATE)
      const state = await services.playTourDuMonde.getState(id)

      const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [Dart.bull()] })

      expect(apercu.completesTour).toBe(true)
    })

    it('faux à trois fléchettes sans bouclage, et sans fléchette', async () => {
      const state = await services.playTourDuMonde.getState(await demarrer())

      expect(services.previewTourDuMondeVisit.execute({ state, darts: RATE }).completesTour).toBe(
        false,
      )
      expect(services.previewTourDuMondeVisit.execute({ state, darts: [] }).completesTour).toBe(
        false,
      )
    })

    it('faux sur la volée qui ne fait que finir le tour de table', async () => {
      const id = await demarrer()
      await services.playTourDuMonde.recordVisit(id, [
        Dart.single(20),
        Dart.single(19),
        Dart.miss(),
      ])
      await services.playTourDuMonde.recordVisit(id, RATE)
      await services.playTourDuMonde.recordVisit(id, [Dart.bull()])
      const state = await services.playTourDuMonde.getState(id)
      expect(state.lastRound).toBe(true)

      const apercu = services.previewTourDuMondeVisit.execute({ state, darts: RATE })

      expect(apercu.state.finished).toBe(true)
      expect(apercu.complete).toBe(true)
      expect(apercu.completesTour).toBe(false)
    })
  })

  it('n’écrit rien : l’aperçu est un calcul, pas un enregistrement', async () => {
    const id = await demarrer()
    const state = await services.playTourDuMonde.getState(id)

    services.previewTourDuMondeVisit.execute({ state, darts: [Dart.single(20)] })

    expect((await services.playTourDuMonde.getState(id)).history).toHaveLength(0)
  })

  it('annule une volée close sur la première fléchette et se rejoue à froid', async () => {
    const id = await demarrer()
    await services.playTourDuMonde.recordVisit(id, [Dart.single(20), Dart.single(19), Dart.miss()])
    await services.playTourDuMonde.recordVisit(id, RATE)

    const avant = await services.playTourDuMonde.getState(id)
    expect(avant.players[0]?.targetIndex).toBe(2)
    expect(avant.players[0]?.dartsThrown).toBe(3)
    expect(avant.currentPlayerIndex).toBe(0)

    const bouclage = await services.playTourDuMonde.recordVisit(id, [Dart.bull()])
    expect(bouclage.state.players[0]?.finishedInDarts).toBe(4)
    expect(bouclage.state.lastRound).toBe(true)

    const journal = (await services.manageBackup.exportAll()).matches[0]?.events ?? []
    const dernier = journal.at(-1)
    if (dernier?.type !== 'VisitRecorded') throw new Error('dernier événement inattendu')
    expect(dernier.darts).toHaveLength(1)
    expect(dernier.darts[0]?.segment).toBe('BULL')

    const { state: revenu } = await services.playTourDuMonde.undoLastVisit(id)

    expect(revenu.players[0]?.targetIndex).toBe(2)
    expect(revenu.players[0]?.dartsThrown).toBe(3)
    expect(revenu.players[0]?.finishedInDarts).toBeNull()
    expect(revenu.lastRound).toBe(false)
    expect(revenu.currentPlayerIndex).toBe(0)
    expect((await services.manageBackup.exportAll()).matches[0]?.events).toHaveLength(3)

    const rejoue = await services.playTourDuMonde.getState(id)
    expect(rejoue).toEqual(avant)
    expect(rejoue).toEqual(revenu)
  })
})
