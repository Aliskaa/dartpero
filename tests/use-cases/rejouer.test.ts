import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { REPLAY_WINDOW } from '@/core/application/use-cases/GetReplayableConfigurationsUseCase'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'

describe('Configurations à rejouer (GetReplayableConfigurations)', () => {
  let services: Services
  let horloge: SettableClock
  let kevin: PlayerId
  let julien: PlayerId
  let sarah: PlayerId

  beforeEach(async () => {
    horloge = new SettableClock(Date.UTC(2026, 9, 1, 12))
    services = fakeServices({ clock: horloge }).services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
    sarah = (await services.managePlayers.create('Sarah')).id
  })

  /** Chaque partie tombe une minute après la précédente : l'ordre est celui des appels. */
  const x01 = (
    joueurs: readonly PlayerId[],
    reglages: Parameters<typeof X01Config.create>[0] = {},
    name?: string,
  ) => {
    horloge.regler(horloge.now() + 60_000)
    return services.startMatch.execute({
      playerIds: joueurs,
      config: X01Config.create(reglages),
      ...(name === undefined ? {} : { name }),
    })
  }
  const lire = () => services.getReplayableConfigurations.execute()

  it('rend une liste vide sur une base vide', async () => {
    expect(await lire()).toEqual([])
  })

  it('fusionne les parties identiques et compte « N fois », la plus récente en tête', async () => {
    for (let i = 0; i < 4; i += 1) await x01([kevin, julien])
    await x01([kevin], { startingScore: 301 })
    await x01([kevin, julien, sarah], { legsToWin: 3 })
    await x01([kevin, julien, sarah], { legsToWin: 3 })

    const configurations = await lire()
    expect(configurations.map((c) => c.count)).toEqual([2, 1, 4])
    expect(configurations.map((c) => c.mode)).toEqual(['X01', 'X01', 'X01'])
  })

  it('traite le même ensemble de joueurs dans un autre ordre comme la même configuration', async () => {
    await x01([kevin, julien, sarah])
    await x01([sarah, kevin, julien])

    const [configuration, ...reste] = await lire()
    expect(reste).toEqual([])
    expect(configuration?.count).toBe(2)
  })

  it('rend les joueurs dans l’ordre de la partie la plus récente du groupe', async () => {
    await x01([kevin, julien, sarah])
    await x01([sarah, kevin, julien])

    const [configuration] = await lire()
    expect(configuration?.playerIds).toEqual([sarah, kevin, julien])
  })

  it('ignore le nom de la partie', async () => {
    await x01([kevin, julien], {}, 'Dimanche chez Paul')
    await x01([kevin, julien])

    const configurations = await lire()
    expect(configurations).toHaveLength(1)
    expect(configurations[0]?.count).toBe(2)
  })

  it('distingue le score, les manches, les sets, la sortie et l’entrée', async () => {
    await x01([kevin, julien])
    await x01([kevin, julien], { startingScore: 301 })
    await x01([kevin, julien], { legsToWin: 3 })
    await x01([kevin, julien], { setsToWin: 2 })
    await x01([kevin, julien], { doubleOut: false })
    await x01([kevin, julien], { doubleIn: true })

    expect(await lire()).toHaveLength(6)
  })

  it('distingue la variante du Cricket et le nombre de sorties de l’entraînement', async () => {
    for (const variant of ['STANDARD', 'CUT_THROAT', 'STANDARD'] as const) {
      horloge.regler(horloge.now() + 60_000)
      await services.playCricket.start({
        playerIds: [kevin, julien],
        config: CricketConfig.create({ variant }),
      })
    }
    for (const rounds of [5, 10, 5]) {
      horloge.regler(horloge.now() + 60_000)
      await services.playCheckoutPractice.start({
        playerId: kevin,
        config: CheckoutPracticeConfig.create({ rounds }),
      })
    }

    const configurations = await lire()
    expect(configurations).toHaveLength(4)
    // La plus récente d'abord : la variante / le nombre jouée en dernier, deux fois.
    expect(configurations.filter((c) => c.mode === 'CRICKET').map((c) => c.count)).toEqual([2, 1])
    expect(
      configurations.filter((c) => c.mode === 'CHECKOUT_PRACTICE').map((c) => c.count),
    ).toEqual([2, 1])
  })

  it('rend les quatre modes, avec leur configuration typée', async () => {
    await x01([kevin])
    horloge.regler(horloge.now() + 60_000)
    await services.playTourDuMonde.start({ playerIds: [kevin], config: TourDuMondeConfig.create() })
    horloge.regler(horloge.now() + 60_000)
    await services.playCricket.start({ playerIds: [kevin], config: CricketConfig.create() })
    horloge.regler(horloge.now() + 60_000)
    await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create(),
    })

    const configurations = await lire()
    expect(configurations.map((c) => c.mode).sort()).toEqual([
      'CHECKOUT_PRACTICE',
      'CRICKET',
      'TOUR_DU_MONDE',
      'X01',
    ])
    for (const configuration of configurations) expect(configuration.playerIds).toEqual([kevin])
  })

  it('compte les parties terminées, abandonnées et en cours', async () => {
    const reglages = { legsToWin: 1, doubleOut: false, startingScore: 301 }
    const terminee = await x01([kevin], reglages)
    const T20 = Dart.triple(20)
    // 301 : 180, puis T20 + T19 + D2 = 121 → la partie se termine.
    await services.recordVisit.execute({ matchId: terminee, darts: [T20, T20, T20] })
    await services.recordVisit.execute({
      matchId: terminee,
      darts: [T20, Dart.triple(19), Dart.double(2)],
    })
    const abandonnee = await x01([kevin], reglages)
    const enCours = await x01([kevin], reglages)

    // Les trois statuts sont bien ceux qu'on croit (sinon le test serait vert à vide).
    const historique = await services.getMatchHistory.execute()
    const fini = (id: MatchId) => historique.find((partie) => partie.id === id)?.finished
    expect(fini(terminee)).toBe(true)
    expect(fini(abandonnee)).toBe(false)
    expect(fini(enCours)).toBe(false)

    const [configuration, ...reste] = await lire()
    expect(reste).toEqual([])
    expect(configuration?.count).toBe(3)
  })

  it('ne fond pas un Cricket aux cibles non standard dans le groupe standard', async () => {
    await services.playCricket.start({ playerIds: [kevin, julien], config: CricketConfig.create() })
    horloge.regler(horloge.now() + 60_000)
    await services.playCricket.start({
      playerIds: [kevin, julien],
      config: CricketConfig.create({ targets: [20, 19, 18] }),
    })

    const configurations = await lire()
    expect(configurations).toHaveLength(2)
    expect(configurations.map((c) => c.count)).toEqual([1, 1])
    expect(configurations[0]?.key).not.toBe(configurations[1]?.key)
  })

  it('ne fond pas un entraînement à plage de restes non standard dans le groupe standard', async () => {
    await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create(),
    })
    horloge.regler(horloge.now() + 60_000)
    await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create({ minTarget: 60 }),
    })

    expect(await lire()).toHaveLength(2)
  })

  it('écarte avant la fusion les parties d’un profil supprimé', async () => {
    await x01([kevin, julien])
    await x01([kevin, julien])
    await x01([kevin, sarah])
    await x01([kevin], { startingScore: 301 })
    await services.managePlayers.remove(sarah)

    const configurations = await lire()
    expect(configurations.map((c) => c.count)).toEqual([1, 2])
    expect(configurations.every((c) => !c.playerIds.includes(sarah))).toBe(true)
  })

  it('ne coupe pas la liste : tout ce qui est distinct est rendu', async () => {
    for (const startingScore of [301, 501, 701]) {
      for (const legsToWin of [1, 2, 3, 4]) await x01([kevin], { startingScore, legsToWin })
    }

    expect(await lire()).toHaveLength(12)
  })

  it('date chaque configuration de sa partie la plus récente', async () => {
    await x01([kevin, julien])
    const derniere = horloge.now() + 60_000
    await x01([kevin, julien])
    await x01([kevin], { startingScore: 301 })

    const configurations = await lire()
    expect(configurations[1]?.lastPlayedAt).toBe(derniere)
  })

  it('date et classe sur la date de lancement (createdAt), jamais sur la dernière modification', async () => {
    // X lancée la première, puis modifiée en dernier ; Y lancée entre les deux.
    const lanceeX = await x01([kevin])
    const lancementX = horloge.now()
    await x01([kevin], { startingScore: 301 })
    const lancementY = horloge.now()
    horloge.regler(lancementY + 3_600_000)
    await services.recordVisit.execute({
      matchId: lanceeX,
      darts: [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
    })

    const configurations = await lire()
    expect(configurations.map((c) => c.lastPlayedAt)).toEqual([lancementY, lancementX])
    expect(configurations.map((c) => (c.mode === 'X01' ? c.config.startingScore : null))).toEqual([
      301, 501,
    ])
  })

  it('prend l’ordre des joueurs de la partie la plus récemment lancée, même si l’autre a été jouée après', async () => {
    const premiere = await x01([kevin, julien])
    await x01([julien, kevin])
    horloge.regler(horloge.now() + 3_600_000)
    await services.recordVisit.execute({
      matchId: premiere,
      darts: [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
    })

    const [configuration] = await lire()
    expect(configuration?.playerIds).toEqual([julien, kevin])
  })

  it('ne lit que les 50 dernières parties (fenêtre du « N fois »)', async () => {
    expect(REPLAY_WINDOW).toBe(50)
    await x01([kevin, julien], { startingScore: 301 }) // la plus ancienne, hors fenêtre
    for (let i = 0; i < REPLAY_WINDOW; i += 1) await x01([kevin, julien])

    const configurations = await lire()
    expect(configurations).toHaveLength(1)
    expect(configurations[0]?.count).toBe(REPLAY_WINDOW)
  })
})
