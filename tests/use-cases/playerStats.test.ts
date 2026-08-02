import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/entities/Match'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
const RIEN = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Statistiques de carrière (use case)', () => {
  let services: Services

  const jouer = async (playerIds: readonly PlayerId[], volees: readonly (readonly Dart[])[]) => {
    const matchId = await services.startMatch.execute({
      playerIds,
      config: X01Config.create({ startingScore: 501, legsToWin: 1 }),
    })
    for (const darts of volees) await services.recordVisit.execute({ matchId, darts })
    return matchId
  }

  beforeEach(() => {
    services = fakeServices().services
  })

  it('ne renvoie rien tant qu’aucune partie n’a été jouée', async () => {
    await services.managePlayers.create('Kevin')
    expect(await services.getPlayerStats.execute()).toEqual([])
  })

  it('cumule les parties d’un joueur et l’habille de son profil', async () => {
    const kevin = await services.managePlayers.create('Kevin', 'lagon')
    const julien = await services.managePlayers.create('Julien')

    await jouer([kevin.id, julien.id], [T20, RIEN, T20, RIEN])
    await jouer([kevin.id, julien.id], [T20, RIEN])

    const stats = await services.getPlayerStats.execute()
    const carriereKevin = stats.find((joueur) => joueur.playerId === kevin.id)

    expect(carriereKevin?.name).toBe('Kevin')
    expect(carriereKevin?.color).toBe('lagon')
    expect(carriereKevin?.matchesPlayed).toBe(2)
    expect(carriereKevin?.count180).toBe(3)
    expect(carriereKevin?.dartsThrown).toBe(9)
  })

  it('classe du meilleur au moins bon, sur la moyenne 3 fléchettes', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    // Kevin marque 180, Julien 60 : l'ordre ne doit pas dépendre de la création.
    await jouer([julien.id, kevin.id], [[Dart.single(20), Dart.single(20), Dart.single(20)], T20])

    const stats = await services.getPlayerStats.execute()
    expect(stats.map((joueur) => joueur.name)).toEqual(['Kevin', 'Julien'])
  })

  it('affiche un joueur supprimé sans nom plutôt que de perdre ses parties', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    await jouer([kevin.id], [T20])
    await services.managePlayers.remove(kevin.id)

    const stats = await services.getPlayerStats.execute()

    expect(stats).toHaveLength(1)
    expect(stats[0]?.name).toBeNull()
    expect(stats[0]?.color).toBeNull()
    expect(stats[0]?.count180).toBe(1)
  })

  it('compte une partie en cours comme les autres', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    await jouer([kevin.id], [T20])

    // La partie n'est pas finie : les fléchettes ont pourtant bien été lancées.
    const stats = await services.getPlayerStats.execute()
    expect(stats[0]?.matchesPlayed).toBe(1)
    expect(stats[0]?.matchesWon).toBe(0)
    // 180 points en 3 fléchettes : la moyenne 3 fléchettes vaut donc 180.
    expect(stats[0]?.average3).toBeCloseTo(180, 5)
  })
})

describe('Suppression d’une partie', () => {
  it('retire la partie de l’historique et des statistiques', async () => {
    const services = fakeServices().services
    const kevin = await services.managePlayers.create('Kevin')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })

    expect(await services.getMatchHistory.execute()).toHaveLength(1)

    await services.deleteMatch.execute(matchId)

    expect(await services.getMatchHistory.execute()).toEqual([])
    expect(await services.getPlayerStats.execute()).toEqual([])
    expect(await services.getOngoingMatch.execute()).toBeNull()
  })
})
