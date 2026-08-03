import { beforeEach, describe, expect, it } from 'vitest'
import type { Dependencies, Services } from '@/composition/container'
import { DomainError } from '@/core/domain/DomainError'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { type MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const T20 = Dart.triple(20)
const D20 = Dart.double(20)

describe('Cycle de vie d’un match', () => {
  let services: Services
  let dependencies: Dependencies
  let kevin: PlayerId
  let matchId: MatchId

  beforeEach(async () => {
    ;({ services, dependencies } = fakeServices())
    kevin = (await services.managePlayers.create('Kevin')).id
    matchId = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create(),
    })
  })

  describe('annulation', () => {
    it('retire la dernière volée et le persiste', async () => {
      await services.recordVisit.execute({ matchId, darts: [T20, T20, T20] })
      await services.recordVisit.execute({ matchId, darts: [T20, T20, T20] })

      const apresAnnulation = await services.undoLastVisit.execute(matchId)
      expect(apresAnnulation.players[0]?.remaining).toBe(321)

      // Relu depuis le dépôt : l'annulation a bien été écrite.
      const relu = await services.getMatchState.execute(matchId)
      expect(relu.players[0]?.remaining).toBe(321)
      expect(relu.history).toHaveLength(1)
    })

    it('refuse d’annuler quand aucune volée n’a été jouée', async () => {
      await expect(services.undoLastVisit.execute(matchId)).rejects.toThrow(DomainError)
    })
  })

  describe('garde-fous', () => {
    it('n’écrit rien quand la volée est illégale', async () => {
      const avant = await dependencies.matches.findById(matchId)

      await expect(
        services.recordVisit.execute({ matchId, darts: [T20, T20, T20, T20] }),
      ).rejects.toThrow(DomainError)

      const apres = await dependencies.matches.findById(matchId)
      expect(apres?.events).toEqual(avant?.events)
    })

    it('refuse de démarrer un match avec un joueur inconnu', async () => {
      await expect(
        services.startMatch.execute({
          playerIds: [PlayerId.of('fantome')],
          config: X01Config.create(),
        }),
      ).rejects.toThrow(DomainError)

      // Rien n'a été persisté au passage.
      expect(await dependencies.matches.listRecent()).toHaveLength(1)
    })

    it('refuse un match inconnu', async () => {
      await expect(services.getMatchState.execute('inexistant' as MatchId)).rejects.toThrow(
        DomainError,
      )
    })
  })

  describe('accueil et historique', () => {
    it('propose de reprendre le match en cours', async () => {
      const encours = await services.getOngoingMatch.execute()

      expect(encours?.id).toBe(matchId)
      expect(encours?.finished).toBe(false)
      expect(encours?.players[0]?.name).toBe('Kevin')
      expect(encours?.totalVisits).toBe(0)
    })

    it('ne propose plus rien une fois le match terminé', async () => {
      const court = await services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
      })
      await services.recordVisit.execute({ matchId: court, darts: [D20] })

      // Le premier match est toujours en cours : c'est lui qu'on doit retrouver.
      expect((await services.getOngoingMatch.execute())?.id).toBe(matchId)

      await services.recordVisit.execute({ matchId, darts: [T20] })
      const historique = await services.getMatchHistory.execute()

      expect(historique).toHaveLength(2)
      expect(historique.find((m) => m.id === court)?.finished).toBe(true)
      expect(historique.find((m) => m.id === court)?.winnerId).toBe(kevin)
    })

    it('classe l’historique du plus récemment joué au plus ancien', async () => {
      const second = await services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create(),
      })

      expect((await services.getMatchHistory.execute()).map((m) => m.id)).toEqual([second, matchId])

      await services.recordVisit.execute({ matchId, darts: [T20] })

      expect((await services.getMatchHistory.execute()).map((m) => m.id)).toEqual([matchId, second])
    })

    it('signale un profil supprimé sans inventer de pseudo', async () => {
      await services.managePlayers.remove(kevin)

      expect((await services.getOngoingMatch.execute())?.players[0]?.name).toBeNull()
    })
  })
})
