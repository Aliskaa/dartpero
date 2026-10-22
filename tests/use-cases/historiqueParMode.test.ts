import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

describe('Historique filtré par mode', () => {
  let services: Services
  let kevin: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
  })

  const unDeChaque = async () => {
    await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.playTourDuMonde.start({
      playerIds: [kevin],
      config: TourDuMondeConfig.create(),
    })
    await services.playCricket.start({ playerIds: [kevin], config: CricketConfig.create() })
    await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create(),
    })
  }

  it('rend tout quand on ne demande rien', async () => {
    await unDeChaque()

    expect((await services.getMatchHistory.execute()).map((partie) => partie.mode).sort()).toEqual([
      'CHECKOUT_PRACTICE',
      'CRICKET',
      'TOUR_DU_MONDE',
      'X01',
    ])
  })

  it('ne rend que le mode demandé, pour chacun des quatre', async () => {
    await unDeChaque()

    for (const mode of ['X01', 'TOUR_DU_MONDE', 'CRICKET', 'CHECKOUT_PRACTICE'] as const) {
      const parties = await services.getMatchHistory.execute(50, mode)
      expect(parties.map((partie) => partie.mode)).toEqual([mode])
    }
  })

  it('filtre avant de couper, pas après', async () => {
    await services.playCricket.start({ playerIds: [kevin], config: CricketConfig.create() })
    for (let partie = 0; partie < 25; partie += 1) {
      await services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create({ legsToWin: 1 }),
      })
    }

    expect(await services.getMatchHistory.execute(20)).toHaveLength(20)
    expect(await services.getMatchHistory.execute(20, 'CRICKET')).toHaveLength(1)
  })

  it('respecte quand même la limite à l’intérieur d’un mode', async () => {
    for (let partie = 0; partie < 5; partie += 1) {
      await services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create({ legsToWin: 1 }),
      })
    }

    expect(await services.getMatchHistory.execute(3, 'X01')).toHaveLength(3)
  })

  it('rend une liste vide plutôt qu’une erreur quand le mode n’a jamais été joué', async () => {
    await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ legsToWin: 1 }),
    })

    expect(await services.getMatchHistory.execute(50, 'CRICKET')).toEqual([])
  })

  it('garde les plus récentes d’abord', async () => {
    const premiere = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ legsToWin: 1 }),
    })
    const seconde = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ legsToWin: 1 }),
    })

    expect((await services.getMatchHistory.execute(50, 'X01')).map((partie) => partie.id)).toEqual([
      seconde,
      premiere,
    ])
  })
})
