import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { RandomSource } from '@/core/application/ports/driven/RandomSource'
import { shufflePlayers } from '@/core/application/use-cases/shufflePlayers'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/** Un aléa scripté : le test dicte chaque tirage, dans l'ordre. */
const tirages = (...valeurs: readonly number[]): RandomSource => {
  let appel = 0
  return {
    nextInt: () => {
      const valeur = valeurs[appel] ?? 0
      appel += 1
      return valeur
    },
  }
}

const ids = (...noms: readonly string[]) => noms as unknown as readonly PlayerId[]

describe('Tirage de l’ordre de passage', () => {
  it('applique un Fisher-Yates, tirage par tirage', () => {
    expect(shufflePlayers(ids('A', 'B', 'C'), tirages(0, 1))).toEqual(['C', 'B', 'A'])
  })

  it('ne perd ni ne duplique personne, quels que soient les tirages', () => {
    const joueurs = ids('A', 'B', 'C', 'D')

    for (const source of [tirages(0, 0, 0), tirages(3, 2, 1), tirages(2, 0, 1)]) {
      expect([...shufflePlayers(joueurs, source)].sort()).toEqual(['A', 'B', 'C', 'D'])
    }
  })

  it('laisse tranquille une liste d’un seul joueur', () => {
    expect(shufflePlayers(ids('A'), tirages())).toEqual(['A'])
  })

  it('ne modifie pas la liste qu’on lui donne', () => {
    const joueurs = ids('A', 'B', 'C')
    shufflePlayers(joueurs, tirages(0, 1))
    expect(joueurs).toEqual(['A', 'B', 'C'])
  })
})

describe('Ordre aléatoire au lancement', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId
  let maiwenn: PlayerId

  /** L'ordre réellement retenu, lu sur la projection. */
  const ordre = async (matchId: Awaited<ReturnType<Services['startMatch']['execute']>>) =>
    (await services.getMatchState.execute(matchId)).players.map((joueur) => joueur.playerId)

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
    maiwenn = (await services.managePlayers.create('Maïwenn')).id
  })

  it('rebat l’ordre demandé sans perdre de joueur', async () => {
    const matchId = await services.startMatch.execute({
      playerIds: [kevin, julien, maiwenn],
      config: X01Config.create({ legsToWin: 1 }),
      shuffle: true,
    })

    const retenu = await ordre(matchId)
    expect([...retenu].sort()).toEqual([kevin, julien, maiwenn].sort())
    expect(retenu[0]).not.toBe(kevin)
  })

  it('respecte l’ordre choisi quand on ne demande rien', async () => {
    const matchId = await services.startMatch.execute({
      playerIds: [kevin, julien, maiwenn],
      config: X01Config.create({ legsToWin: 1 }),
    })

    expect(await ordre(matchId)).toEqual([kevin, julien, maiwenn])
  })

  it('fige l’ordre tiré : ni l’annulation ni le rejeu ne le redistribuent', async () => {
    const matchId = await services.startMatch.execute({
      playerIds: [kevin, julien, maiwenn],
      config: X01Config.create({ legsToWin: 1 }),
      shuffle: true,
    })
    const retenu = await ordre(matchId)

    await services.recordVisit.execute({ matchId, darts: [Dart.triple(20)] })
    expect(await ordre(matchId)).toEqual(retenu)

    await services.undoLastVisit.execute(matchId)
    expect(await ordre(matchId)).toEqual(retenu)

    expect(await ordre(matchId)).toEqual(retenu)
  })

  it('ne retire pas l’ordre quand on remet ça', async () => {
    const ancienne = await services.startMatch.execute({
      playerIds: [kevin, julien, maiwenn],
      config: X01Config.create({ legsToWin: 1 }),
      shuffle: true,
    })
    const retenu = await ordre(ancienne)

    const nouvelle = await services.restartMatch.execute(ancienne)

    expect(await ordre(nouvelle)).toEqual(retenu)
  })

  it('vaut pour le Tour du monde et le Cricket, pas seulement le X01', async () => {
    const tour = await services.playTourDuMonde.start({
      playerIds: [kevin, julien, maiwenn],
      config: TourDuMondeConfig.create(),
      shuffle: true,
    })
    const cricket = await services.playCricket.start({
      playerIds: [kevin, julien, maiwenn],
      config: CricketConfig.create(),
      shuffle: true,
    })

    const ordreTour = (await services.playTourDuMonde.getState(tour)).players.map((j) => j.playerId)
    const ordreCricket = (await services.playCricket.getState(cricket)).players.map(
      (j) => j.playerId,
    )

    expect([...ordreTour].sort()).toEqual([kevin, julien, maiwenn].sort())
    expect([...ordreCricket].sort()).toEqual([kevin, julien, maiwenn].sort())
  })

  it('refuse toujours un profil inconnu, tirage ou pas', async () => {
    await expect(
      services.startMatch.execute({
        playerIds: [kevin, 'fantome' as PlayerId],
        config: X01Config.create({ legsToWin: 1 }),
        shuffle: true,
      }),
    ).rejects.toThrow(/Unknown player/)
  })
})
