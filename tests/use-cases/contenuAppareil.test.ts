import { describe, expect, it } from 'vitest'
import { GAME_MODE_IDS } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { fakeServices } from '../fakes'
import { lancer } from './lancerPartie'

describe('GetDeviceContents — ce que contient ce téléphone', () => {
  it('base vide : 0 partie, 0 joueur', async () => {
    const { services } = fakeServices()

    expect(await services.getDeviceContents.execute()).toEqual({ matches: 0, players: 0 })
  })

  it('compte les profils, même sans partie', async () => {
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')

    expect(await services.getDeviceContents.execute()).toEqual({ matches: 0, players: 1 })
  })

  it.each(GAME_MODE_IDS)('une partie de %s compte, entraînement compris', async (mode) => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const joueurs =
      mode === 'KILLER'
        ? [kevin.id, (await services.managePlayers.create('Julien')).id]
        : [kevin.id]

    await lancer(services, mode, joueurs)

    expect(await services.getDeviceContents.execute()).toEqual({
      matches: 1,
      players: joueurs.length,
    })
  })

  it('compte au-delà des 20 parties que lit la partie en cours, en cours comme abandonnées', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    for (let rang = 0; rang < 25; rang += 1) {
      await services.startMatch.execute({
        playerIds: [kevin.id, julien.id],
        config: X01Config.create(),
      })
    }

    expect(await services.getDeviceContents.execute()).toEqual({ matches: 25, players: 2 })
  })

  it('un profil supprimé ne retire pas ses parties', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    await lancer(services, 'X01', [kevin.id, julien.id])

    await services.managePlayers.remove(julien.id)

    expect(await services.getDeviceContents.execute()).toEqual({ matches: 1, players: 1 })
  })

  it('une partie supprimée ne compte plus', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const id = await lancer(services, 'CRICKET', [kevin.id])
    await lancer(services, 'TOUR_DU_MONDE', [kevin.id])

    await services.deleteMatch.execute(id)

    expect(await services.getDeviceContents.execute()).toEqual({ matches: 1, players: 1 })
  })
})
