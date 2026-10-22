import { describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { matchStatus } from '@/core/application/use-cases/summarize'
import { GAME_MODE_IDS } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'
import { lancer } from './lancerPartie'

/** Un seul joueur, 40 points, un double 20 finit la manche (double out par défaut du domaine). */
const partieSolo = async (services: Services, config: Parameters<typeof X01Config.create>[0]) => {
  const kevin = await services.managePlayers.create('Kevin')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id],
    config: X01Config.create({ startingScore: 40, ...config }),
  })
  const sortir = () => services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })
  const legsPlayed = async () => {
    const [partie] = await services.getMatchHistory.execute()
    if (partie?.mode !== 'X01') throw new Error('X01 attendu')
    return partie.legsPlayed
  }
  return { matchId, sortir, legsPlayed }
}

describe('X01Summary.legsPlayed — le nombre de LegWon du journal', () => {
  it('vaut 0 au départ', async () => {
    const { services } = fakeServices()
    const { legsPlayed } = await partieSolo(services, { legsToWin: 2, setsToWin: 1 })

    expect(await legsPlayed()).toBe(0)
  })

  it('compte les manches gagnées en cours de partie, tous sets confondus', async () => {
    const { services } = fakeServices()
    const { sortir, legsPlayed } = await partieSolo(services, { legsToWin: 2, setsToWin: 2 })

    await sortir()
    expect(await legsPlayed()).toBe(1)
    await sortir()
    expect(await legsPlayed()).toBe(2)
    await sortir()
    expect(await legsPlayed()).toBe(3)

    const [partie] = await services.getMatchHistory.execute()
    expect(partie?.finished).toBe(false)
  })

  it('reste juste une fois la partie terminée, avec plusieurs sets', async () => {
    const { services } = fakeServices()
    const { sortir, legsPlayed } = await partieSolo(services, { legsToWin: 2, setsToWin: 2 })

    for (const _ of [0, 1, 2, 3]) await sortir()

    const [partie] = await services.getMatchHistory.execute()
    expect(partie?.finished).toBe(true)
    expect(await legsPlayed()).toBe(4)
  })

  it('redescend quand on annule la volée qui gagnait une manche', async () => {
    const { services } = fakeServices()
    const { matchId, sortir, legsPlayed } = await partieSolo(services, {
      legsToWin: 2,
      setsToWin: 2,
    })

    await sortir()
    await sortir()
    expect(await legsPlayed()).toBe(2)

    await services.undoLastVisit.execute(matchId)
    expect(await legsPlayed()).toBe(1)
    await services.undoLastVisit.execute(matchId)
    expect(await legsPlayed()).toBe(0)
  })

  it('annuler la volée qui gagne la partie la rouvre et retire la manche', async () => {
    const { services } = fakeServices()
    const { matchId, sortir, legsPlayed } = await partieSolo(services, {
      legsToWin: 1,
      setsToWin: 1,
    })

    await sortir()
    expect((await services.getMatchHistory.execute())[0]?.finished).toBe(true)

    await services.undoLastVisit.execute(matchId)

    expect((await services.getMatchHistory.execute())[0]?.finished).toBe(false)
    expect(await legsPlayed()).toBe(0)
  })

  it('compte les manches de chaque joueur : deux joueurs qui en gagnent une chacun font 2', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 2, setsToWin: 1 }),
    })
    const sortir = () => services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })

    await sortir() // Kevin gagne la manche 1
    await sortir() // le départ alterne : Julien gagne la manche 2

    const [partie] = await services.getMatchHistory.execute()
    if (partie?.mode !== 'X01') throw new Error('X01 attendu')
    expect(partie.legsPlayed).toBe(2)
    expect(partie.finished).toBe(false)
    expect(partie.players.map((joueur) => joueur.legsWonInSet)).toEqual([1, 1])
  })

  it('reste juste sans sets, manche finale comprise', async () => {
    const { services } = fakeServices()
    const { sortir, legsPlayed } = await partieSolo(services, { legsToWin: 1, setsToWin: 1 })

    await sortir()

    const [partie] = await services.getMatchHistory.execute()
    expect(partie?.finished).toBe(true)
    expect(await legsPlayed()).toBe(1)
  })
})

describe('matchStatus — une règle, un endroit', () => {
  const id = MatchId.of('a')
  const autre = MatchId.of('b')

  it('une partie terminée est terminée, en cours globale ou non', () => {
    expect(matchStatus({ id, finished: true }, id)).toBe('FINISHED')
    expect(matchStatus({ id, finished: true }, autre)).toBe('FINISHED')
    expect(matchStatus({ id, finished: true }, null)).toBe('FINISHED')
  })

  it('la partie en cours est la seule non terminée à l’être', () => {
    expect(matchStatus({ id, finished: false }, id)).toBe('ONGOING')
    expect(matchStatus({ id, finished: false }, autre)).toBe('ABANDONED')
  })

  it('sans partie en cours connue (au-delà des 20 plus récentes), toute non terminée est abandonnée', () => {
    expect(matchStatus({ id, finished: false }, null)).toBe('ABANDONED')
  })

  describe.each(GAME_MODE_IDS)('%s, de bout en bout', (mode) => {
    it('la plus récente non terminée est en cours, l’autre est abandonnée', async () => {
      const { services } = fakeServices()
      const kevin = (await services.managePlayers.create('Kevin')).id
      const julien = (await services.managePlayers.create('Julien')).id
      const joueurs = mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]

      const ancienne = await lancer(services, mode, joueurs)
      const recente = await lancer(services, mode, joueurs)

      const enCours = await services.getOngoingMatch.execute()
      expect(enCours?.id).toBe(recente)

      const historique = await services.getMatchHistory.execute()
      const statuts = Object.fromEntries(
        historique.map((partie) => [partie.id, matchStatus(partie, enCours?.id ?? null)]),
      )
      expect(statuts[recente]).toBe('ONGOING')
      expect(statuts[ancienne]).toBe('ABANDONED')
    })

    it('sous un filtre de mode, le statut reste celui de la partie en cours globale', async () => {
      const { services } = fakeServices()
      const kevin = (await services.managePlayers.create('Kevin')).id
      const julien = (await services.managePlayers.create('Julien')).id
      const joueurs = mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]
      const autreMode = GAME_MODE_IDS.find((candidat) => candidat !== mode)
      if (!autreMode) throw new Error('un second mode est attendu')

      const duMode = await lancer(services, mode, joueurs)
      const ailleurs = await lancer(
        services,
        autreMode,
        autreMode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien],
      )

      const enCours = await services.getOngoingMatch.execute()
      expect(enCours?.id).toBe(ailleurs)

      const filtre = await services.getMatchHistory.execute(50, mode)
      expect(filtre.map((partie) => partie.id)).toEqual([duMode])
      expect(matchStatus(filtre[0] as (typeof filtre)[number], enCours?.id ?? null)).toBe(
        'ABANDONED',
      )
    })
  })
})
