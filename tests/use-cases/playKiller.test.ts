import { beforeEach, describe, expect, it } from 'vitest'
import type { Dependencies, Services } from '@/composition/container'
import type { KillerSummary } from '@/core/application/ports/driving/MatchSummary'
import { leadingPlayers, rankPlayers } from '@/core/application/use-cases/rankPlayers'
import { DomainError } from '@/core/domain/DomainError'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'
import { ouverture } from './lancerPartie'

/** Le Killer de bout en bout, sur les fakes en mémoire. Kevin a le 8, Julien le 14, Sarah le 3. */
describe('PlayKiller', () => {
  let services: Services
  let dependencies: Dependencies
  let kevin: PlayerId
  let julien: PlayerId
  let sarah: PlayerId

  beforeEach(async () => {
    ;({ services, dependencies } = fakeServices())
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
    sarah = (await services.managePlayers.create('Sarah')).id
  })

  const partie = (joueurs = [kevin, julien, sarah], config = KillerConfig.create()) =>
    services.playKiller.start({
      playerIds: joueurs,
      config,
      numbers: [8, 14, 3].slice(0, joueurs.length) as never,
    })

  const journal = async (id: MatchId) => (await dependencies.matches.findById(id))?.events ?? []

  it('écrit les numéros choisis dans l’ouverture, et la configuration', async () => {
    const id = await partie()
    expect(await ouverture(dependencies, id)).toEqual({
      type: 'KillerStarted',
      config: { startingLives: 3, selfHitCostsLives: false },
      playerIds: [kevin, julien, sarah],
      numbers: [8, 14, 3],
      startingPlayerIndex: 0,
    })
  })

  it('sans numéros, les tire au sort et les ÉCRIT : le rejeu redonne les mêmes', async () => {
    const id = await services.playKiller.start({
      playerIds: [kevin, julien],
      config: KillerConfig.create({ startingLives: 5 }),
    })
    const premiere = await ouverture(dependencies, id)
    if (premiere.type !== 'KillerStarted') throw new Error('ouverture Killer attendue')

    expect(premiere.numbers).toHaveLength(2)
    expect(new Set(premiere.numbers).size).toBe(2)
    expect((await services.playKiller.getState(id)).players.map((p) => p.number)).toEqual(
      premiere.numbers,
    )
    expect((await services.playKiller.getState(id)).players[0]?.lives).toBe(5)
  })

  it('refuse un joueur seul, un profil inconnu, des numéros en double — sans rien écrire', async () => {
    await expect(
      services.playKiller.start({
        playerIds: [kevin],
        config: KillerConfig.create(),
        numbers: [8],
      }),
    ).rejects.toThrow(DomainError)
    await expect(
      services.playKiller.start({
        playerIds: [kevin, 'fantome' as PlayerId],
        config: KillerConfig.create(),
      }),
    ).rejects.toThrow(DomainError)
    await expect(
      services.playKiller.start({
        playerIds: [kevin, julien],
        config: KillerConfig.create(),
        numbers: [8, 8],
      }),
    ).rejects.toThrow(DomainError)
    expect(await dependencies.matches.listAll()).toHaveLength(0)
  })

  it('enregistre une volée et rend ses seuls jalons', async () => {
    const id = await partie()
    const { state, visit, milestones } = await services.playKiller.recordVisit(id, [
      Dart.double(8),
      Dart.triple(14),
    ])

    expect(visit.effects.map((e) => e.type)).toEqual(['BECAME_KILLER', 'HIT'])
    expect(milestones).toEqual([
      { type: 'BecameKiller', playerId: kevin },
      { type: 'PlayerEliminated', playerId: julien, by: kevin },
    ])
    expect(state.players[1]?.eliminated).toBe(true)
  })

  it('n’écrit au journal que les fléchettes jouées (volée tronquée à la victoire)', async () => {
    const id = await partie([kevin, julien])
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.triple(14), Dart.single(3)])

    expect((await journal(id)).at(-1)).toEqual({
      type: 'VisitRecorded',
      darts: [Dart.double(8), Dart.triple(14)],
    })
  })

  it('refuse une volée après la fin, sans rien écrire', async () => {
    const id = await partie([kevin, julien])
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.triple(14)])
    const avant = (await journal(id)).length

    await expect(services.playKiller.recordVisit(id, [Dart.miss()])).rejects.toThrow(DomainError)
    expect(await journal(id)).toHaveLength(avant)
  })

  it('annule à travers la victoire : la volée se rouvre, l’éliminé revient', async () => {
    const id = await partie([kevin, julien])
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.triple(14)])

    const { state, darts } = await services.playKiller.undoLastVisit(id)

    expect(darts).toEqual([Dart.double(8)])
    expect(state.finished).toBe(false)
    expect(state.players.map((p) => [p.lives, p.killer, p.eliminated])).toEqual([
      [3, false, false],
      [3, false, false],
    ])
    expect(state.currentPlayerIndex).toBe(0)
    await expect(services.playKiller.undoLastVisit(id)).rejects.toThrow(DomainError)
  })

  it('variante : annule à travers une auto-élimination, le lanceur revient en jeu', async () => {
    const id = await partie(undefined, KillerConfig.create({ selfHitCostsLives: true }))
    const { state: apres } = await services.playKiller.recordVisit(id, [
      Dart.double(8),
      Dart.triple(8),
    ])
    expect(apres.eliminations).toEqual([{ playerId: kevin, by: kevin }])
    expect(apres.finished).toBe(false)

    const { state, darts } = await services.playKiller.undoLastVisit(id)

    expect(darts).toEqual([Dart.double(8)])
    expect(state.eliminations).toEqual([])
    expect(state.players[0]).toMatchObject({ lives: 3, eliminated: false })
    expect(state.currentPlayerIndex).toBe(0)
    expect(await journal(id)).toHaveLength(1)
  })

  it('hors statistiques de carrière : une partie de Killer ne compte nulle part', async () => {
    const id = await partie([kevin, julien])
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.triple(14)])

    expect(await services.getPlayerStats.execute()).toEqual([])
  })
})

describe('Killer — résumé, classement, relance', () => {
  it('le résumé porte numéros, vies, killer, éliminés et le rang du domaine', async () => {
    const { services } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const julien = (await services.managePlayers.create('Julien')).id
    const sarah = (await services.managePlayers.create('Sarah')).id
    const id = await services.playKiller.start({
      playerIds: [kevin, julien, sarah],
      config: KillerConfig.create(),
      numbers: [8, 14, 3],
    })
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.single(14)])

    const [partie] = await services.getMatchHistory.execute()
    if (partie?.mode !== 'KILLER') throw new Error('résumé Killer attendu')
    const resume: KillerSummary = partie

    expect(resume.players.map((p) => [p.name, p.number, p.lives, p.killer, p.rank])).toEqual([
      ['Kevin', 8, 3, true, 1],
      ['Julien', 14, 2, false, 3],
      ['Sarah', 3, 3, false, 1],
    ])
    expect(rankPlayers(resume).map((p) => p.name)).toEqual(['Kevin', 'Sarah', 'Julien'])
    expect(leadingPlayers(resume).map((p) => p.name)).toEqual(['Kevin', 'Sarah'])

    await services.playKiller.recordVisit(id, [Dart.miss()])
    await services.playKiller.recordVisit(id, [Dart.miss()])
    await services.playKiller.recordVisit(id, [Dart.double(14), Dart.triple(3)])
    const [fin] = await services.getMatchHistory.execute()
    if (fin?.mode !== 'KILLER') throw new Error('résumé Killer attendu')
    expect(fin.finished).toBe(true)
    expect(fin.winnerId).toBe(kevin)
    expect(rankPlayers(fin).map((p) => [p.name, p.rank])).toEqual([
      ['Kevin', 1],
      ['Sarah', 2],
      ['Julien', 3],
    ])
    expect(leadingPlayers(fin).map((p) => p.name)).toEqual(['Kevin'])
  })

  it('« On remet ça » relance la même configuration avec un NOUVEAU tirage', async () => {
    const { services, dependencies } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const julien = (await services.managePlayers.create('Julien')).id
    const id = await services.playKiller.start({
      playerIds: [kevin, julien],
      config: KillerConfig.create({ startingLives: 5, selfHitCostsLives: true }),
      numbers: [8, 14],
      name: 'Revanche',
    })

    const relance = await services.restartMatch.execute(id)
    const nouvelle = await ouverture(dependencies, relance)
    if (nouvelle.type !== 'KillerStarted') throw new Error('ouverture Killer attendue')

    expect(nouvelle.config).toEqual({ startingLives: 5, selfHitCostsLives: true })
    expect(nouvelle.playerIds).toEqual([kevin, julien])
    expect(nouvelle.name).toBe('Revanche')
    expect(nouvelle.numbers).toEqual([1, 3])
  })
})
