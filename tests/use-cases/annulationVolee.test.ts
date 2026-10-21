import { beforeEach, describe, expect, it } from 'vitest'
import type { Dependencies, Services } from '@/composition/container'
import { DomainError } from '@/core/domain/DomainError'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { resolveVisit } from '@/core/domain/services/visitOutcome'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const T20 = Dart.triple(20)
const T19 = Dart.triple(19)
const S5 = Dart.single(5)
const S20 = Dart.single(20)
const S1 = Dart.single(1)
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]
const libelles = (darts: readonly Dart[]): string[] => darts.map((dart) => Dart.label(dart))

/**
 * Lot `annulation-volee` : un appui retire **une fléchette**, la dernière jouée.
 * Le use case tronque le journal, rejoue la projection, et rend les fléchettes
 * restantes de la volée pour qu'elles reviennent à la saisie locale.
 */
describe('Annulation fléchette par fléchette (use cases)', () => {
  let services: Services
  let dependencies: Dependencies
  let kevin: PlayerId
  let julien: PlayerId

  beforeEach(async () => {
    ;({ services, dependencies } = fakeServices())
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
  })

  const journal = async (id: MatchId) => (await dependencies.matches.findById(id))?.events ?? []

  describe('X01', () => {
    const demarrer = (config = X01Config.create()) =>
      services.startMatch.execute({ playerIds: [kevin, julien], config })

    it('rouvre la volée de Kevin : T20·T19·S5, puis 384 et le tour lui revient', async () => {
      const id = await demarrer()
      await services.recordVisit.execute({ matchId: id, darts: [T20, T19, S5] })
      expect((await services.getMatchState.execute(id)).currentPlayerIndex).toBe(1)

      const { state, darts } = await services.undoLastVisit.execute(id)

      expect(libelles(darts)).toEqual(['T20', 'T19'])
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.players[0]?.remaining).toBe(501)
      // Le reste affiché suit les fléchettes encore posées : 501 − 117 = 384.
      const joueur = state.players[0]
      if (!joueur) throw new Error('joueur attendu')
      const apercu = services.previewVisit.execute({
        config: state.config,
        remaining: joueur.remaining,
        hasOpened: joueur.hasOpened,
        darts,
      })
      expect(apercu.remainingAfter).toBe(384)
      expect(apercu.complete).toBe(false)
      // La volée a quitté le journal : elle n'existe plus qu'en saisie.
      expect(await journal(id)).toHaveLength(1)
    })

    it('rend une volée vide quand elle ne comptait qu’une fléchette', async () => {
      const id = await demarrer()
      await services.recordVisit.execute({ matchId: id, darts: [T20] })

      const { darts } = await services.undoLastVisit.execute(id)

      expect(darts).toEqual([])
    })

    it('défait un bust : la volée rouverte n’est plus perdue', async () => {
      const id = await demarrer(X01Config.create({ startingScore: 50 }))
      // S20 · S20 · S20 depuis 50 : bust sur la troisième.
      await services.recordVisit.execute({ matchId: id, darts: [S20, S20, S20] })
      expect((await services.getMatchState.execute(id)).history.at(-1)?.outcome).toBe('BUSTED')

      const { state, darts } = await services.undoLastVisit.execute(id)
      const joueur = state.players[0]
      if (!joueur) throw new Error('joueur attendu')
      const apercu = services.previewVisit.execute({
        config: state.config,
        remaining: joueur.remaining,
        hasOpened: joueur.hasOpened,
        darts,
      })

      expect(libelles(darts)).toEqual(['S20', 'S20'])
      expect(apercu.outcome).toBe('SCORED')
      expect(apercu.remainingAfter).toBe(10)
    })

    it('défait une manche gagnée : elle n’est plus gagnée, la main revient au sortant', async () => {
      const id = await demarrer(X01Config.create({ startingScore: 40 }))
      await services.recordVisit.execute({ matchId: id, darts: [S20, Dart.double(10)] })
      const gagnee = await services.getMatchState.execute(id)
      expect(gagnee.players[0]?.legsWonInSet).toBe(1)
      expect(gagnee.legNumber).toBe(1)

      const { state, darts } = await services.undoLastVisit.execute(id)

      expect(libelles(darts)).toEqual(['S20'])
      expect(state.players[0]?.legsWonInSet).toBe(0)
      expect(state.legNumber).toBe(0)
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.players[0]?.remaining).toBe(40)
    })

    it('défait un set et la fin de partie', async () => {
      const id = await demarrer(X01Config.create({ startingScore: 40, legsToWin: 1, setsToWin: 1 }))
      await services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })
      expect((await services.getMatchState.execute(id)).winnerId).toBe(kevin)

      const { state, darts } = await services.undoLastVisit.execute(id)

      expect(darts).toEqual([])
      expect(state.winnerId).toBeNull()
      expect(state.players[0]?.setsWon).toBe(0)
      expect(state.milestones).toEqual([])
    })

    it('défait la volée qui gagne un set : sets, manches et main recalculés', async () => {
      const id = await demarrer(X01Config.create({ startingScore: 40, legsToWin: 1, setsToWin: 2 }))
      // Kevin gagne le 1er set ; Julien, qui commence la 2e manche, gagne le 2e set : 1 partout.
      await services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })
      await services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })
      const avant = await services.getMatchState.execute(id)
      expect(avant.players.map((joueur) => joueur.setsWon)).toEqual([1, 1])
      expect(avant.setNumber).toBe(2)

      const { state, darts } = await services.undoLastVisit.execute(id)

      expect(darts).toEqual([])
      expect(state.players.map((joueur) => joueur.setsWon)).toEqual([1, 0])
      expect(state.players.map((joueur) => joueur.legsWonInSet)).toEqual([0, 0])
      expect(state.setNumber).toBe(1)
      expect(state.legNumber).toBe(1)
      // La 2e manche, commencée par Julien : la main lui revient.
      expect(state.currentPlayerIndex).toBe(1)
      expect(state.players[1]?.remaining).toBe(40)
      expect(state.winnerId).toBeNull()
    })

    it('à cheval sur deux joueurs : la volée de Julien d’abord, puis celle de Kevin', async () => {
      const id = await demarrer()
      await services.recordVisit.execute({ matchId: id, darts: [T20, T19, S5] })
      await services.recordVisit.execute({ matchId: id, darts: [S20, Dart.triple(5), S1] })

      const premier = await services.undoLastVisit.execute(id)
      expect(premier.state.currentPlayerIndex).toBe(1)
      expect(libelles(premier.darts)).toEqual(['S20', 'T5'])

      const second = await services.undoLastVisit.execute(id)
      expect(second.state.currentPlayerIndex).toBe(0)
      expect(libelles(second.darts)).toEqual(['T20', 'T19'])
    })

    it('rien à retirer : DomainError, et rien n’est écrit', async () => {
      const id = await demarrer()
      const avant = await dependencies.matches.findById(id)

      await expect(services.undoLastVisit.execute(id)).rejects.toThrow(DomainError)
      expect(await dependencies.matches.findById(id)).toEqual(avant)
    })

    it('un journal illisible (la première projection lève) : rien n’est écrit', async () => {
      const id = await demarrer()
      const record = await dependencies.matches.findById(id)
      if (!record) throw new Error('partie attendue')
      // Une volée de quatre fléchettes : illégale, la projection lève.
      const corrompu = {
        ...record,
        events: [...record.events, { type: 'VisitRecorded' as const, darts: [S1, S1, S1, S1] }],
      }
      await dependencies.matches.save(corrompu)

      await expect(services.undoLastVisit.execute(id)).rejects.toThrow(DomainError)
      expect(await dependencies.matches.findById(id)).toEqual(corrompu)
    })

    it('rejoue à froid le journal tronqué', async () => {
      const id = await demarrer()
      await services.recordVisit.execute({ matchId: id, darts: [T20, T19, S5] })
      await services.recordVisit.execute({ matchId: id, darts: [S20, S20, S20] })

      const { state } = await services.undoLastVisit.execute(id)

      expect(await services.getMatchState.execute(id)).toEqual(state)
    })
  })

  describe('Cricket', () => {
    const COURT = CricketConfig.create({ targets: [20, 19, 'BULL'] })

    it('défait la victoire et rend les marques de chacun', async () => {
      const id = await services.playCricket.start({ playerIds: [kevin, julien], config: COURT })
      await services.playCricket.recordVisit(id, [T20, T19, Dart.bullseye()])
      await services.playCricket.recordVisit(id, RATE)
      const gagnee = await services.playCricket.recordVisit(id, [Dart.bull()])
      expect(gagnee.state.finished).toBe(true)

      const { state, darts } = await services.playCricket.undoLastVisit(id)

      expect(darts).toEqual([])
      expect(state.finished).toBe(false)
      expect(state.winnerId).toBeNull()
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.players[0]?.marks).toEqual([3, 3, 2])
    })

    it('cut-throat : les points rendus à l’adversaire repartent avec la fléchette', async () => {
      const config = CricketConfig.create({ targets: [20, 19, 'BULL'], variant: 'CUT_THROAT' })
      const id = await services.playCricket.start({ playerIds: [kevin, julien], config })
      await services.playCricket.recordVisit(id, [T20, T20, S20])
      expect((await services.playCricket.getState(id)).players[1]?.score).toBe(80)

      const { state, darts } = await services.playCricket.undoLastVisit(id)

      expect(libelles(darts)).toEqual(['T20', 'T20'])
      expect(state.players[1]?.score).toBe(0)
      const apercu = services.previewCricketVisit.execute({ state, darts })
      expect(apercu.state.players[1]?.score).toBe(60)
      expect(apercu.complete).toBe(false)
    })
  })

  describe('Tour du monde', () => {
    const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })

    it('rien à retirer : DomainError, journal inchangé', async () => {
      const id = await services.playTourDuMonde.start({ playerIds: [kevin, julien], config: COURT })
      const avant = await dependencies.matches.findById(id)

      await expect(services.playTourDuMonde.undoLastVisit(id)).rejects.toThrow(DomainError)
      expect(await dependencies.matches.findById(id)).toEqual(avant)
    })

    it('au dernier tour : défaire le bouclage rend le tour de table normal', async () => {
      const id = await services.playTourDuMonde.start({ playerIds: [kevin, julien], config: COURT })
      await services.playTourDuMonde.recordVisit(id, [S20, Dart.single(19), Dart.miss()])
      await services.playTourDuMonde.recordVisit(id, RATE)
      await services.playTourDuMonde.recordVisit(id, [Dart.bull()])
      await services.playTourDuMonde.recordVisit(id, [S20, Dart.single(19), Dart.bull()])
      expect((await services.playTourDuMonde.getState(id)).finished).toBe(true)

      const julienRouvert = await services.playTourDuMonde.undoLastVisit(id)
      expect(julienRouvert.state.finished).toBe(false)
      expect(julienRouvert.state.lastRound).toBe(true)
      expect(julienRouvert.state.currentPlayerIndex).toBe(1)
      expect(julienRouvert.darts).toHaveLength(2)

      const kevinRouvert = await services.playTourDuMonde.undoLastVisit(id)
      expect(kevinRouvert.state.lastRound).toBe(false)
      expect(kevinRouvert.state.players[0]?.finishedInDarts).toBeNull()
      expect(kevinRouvert.darts).toEqual([])
    })
  })

  describe('Entraînement', () => {
    const CONFIG = CheckoutPracticeConfig.create({ rounds: 3 })

    it('défaire la dernière manche (sans RoundStarted final) garde le même reste', async () => {
      const id = await services.playCheckoutPractice.start({ playerId: kevin, config: CONFIG })
      for (const _ of [0, 1]) await services.playCheckoutPractice.recordVisit(id, [S1, S1, S1])
      const cible = (await services.playCheckoutPractice.getState(id)).current?.target
      await services.playCheckoutPractice.recordVisit(id, [S1, S1, S1])
      expect((await services.playCheckoutPractice.getState(id)).finished).toBe(true)
      expect((await journal(id)).at(-1)?.type).toBe('VisitRecorded')

      const { state, darts } = await services.playCheckoutPractice.undoLastVisit(id)

      expect(libelles(darts)).toEqual(['S1', 'S1'])
      expect(state.finished).toBe(false)
      expect(state.roundsPlayed).toBe(2)
      expect(state.current?.target).toBe(cible)
      expect((await journal(id)).at(-1)?.type).toBe('RoundStarted')
      expect((await services.playCheckoutPractice.getState(id)).current?.target).toBe(cible)
    })

    it('la manche rouverte garde son reste, le RoundStarted suivant part', async () => {
      const id = await services.playCheckoutPractice.start({ playerId: kevin, config: CONFIG })
      const cible = (await services.playCheckoutPractice.getState(id)).current?.target
      await services.playCheckoutPractice.recordVisit(id, [S1, S1, S1])
      expect(await journal(id)).toHaveLength(4)

      const { state, darts } = await services.playCheckoutPractice.undoLastVisit(id)

      expect(libelles(darts)).toEqual(['S1', 'S1'])
      expect(state.current?.target).toBe(cible)
      expect(state.roundsPlayed).toBe(0)
      const evenements = await journal(id)
      expect(evenements.map((evenement) => evenement.type)).toEqual([
        'CheckoutPracticeStarted',
        'RoundStarted',
      ])
      // Rejeu à froid : même reste à viser.
      expect((await services.playCheckoutPractice.getState(id)).current?.target).toBe(cible)
    })
  })
})

/**
 * L'invariant du lot, dans chaque mode : la volée rouverte n'est **jamais**
 * complète. Privée de sa dernière fléchette, une volée ne conclut pas — sans
 * quoi l'écran l'enverrait aussitôt au journal, et l'annulation ne ferait rien.
 *
 * Chaque mode joue une partie scénarisée (volée de trois, bust, sortie,
 * victoire, bouclage…), puis remonte tout le journal, une volée après l'autre.
 */
describe.each(GAME_MODE_IDS)('Invariant : la volée rouverte n’est jamais complète (%s)', (mode) => {
  type Joue = {
    readonly id: MatchId
    /** Annule et rend l'aperçu des fléchettes rouvertes, ou `null` s'il ne reste rien. */
    readonly rouvrir: () => Promise<{ darts: readonly Dart[]; complete: boolean } | null>
  }

  const jouer = async (services: Services, joueurs: readonly PlayerId[]): Promise<Joue> => {
    const m: GameModeId = mode
    switch (m) {
      case 'X01': {
        const id = await services.startMatch.execute({
          playerIds: joueurs,
          config: X01Config.create({ startingScore: 101, legsToWin: 1 }),
        })
        const volees = [
          [T20, S1, S1],
          [S20, S20, S20],
          [S20, S20],
          [S1, S1, S1],
          [Dart.single(19), Dart.double(10)],
        ]
        for (const darts of volees) await services.recordVisit.execute({ matchId: id, darts })
        expect((await services.getMatchState.execute(id)).winnerId).not.toBeNull()
        return {
          id,
          rouvrir: async () => {
            if ((await services.getMatchState.execute(id)).history.length === 0) return null
            const { state, darts } = await services.undoLastVisit.execute(id)
            const joueur = state.players[state.currentPlayerIndex]
            if (!joueur) throw new Error('joueur attendu')
            const apercu = services.previewVisit.execute({
              config: state.config,
              remaining: joueur.remaining,
              hasOpened: joueur.hasOpened,
              darts,
            })
            return { darts, complete: apercu.complete }
          },
        }
      }
      case 'CRICKET': {
        const config = CricketConfig.create({ targets: [20, 19, 'BULL'] })
        const id = await services.playCricket.start({ playerIds: joueurs, config })
        for (const darts of [[T20, T19, Dart.bullseye()], RATE, [Dart.bull()]]) {
          await services.playCricket.recordVisit(id, darts)
        }
        expect((await services.playCricket.getState(id)).finished).toBe(true)
        return {
          id,
          rouvrir: async () => {
            if ((await services.playCricket.getState(id)).history.length === 0) return null
            const { state, darts } = await services.playCricket.undoLastVisit(id)
            return {
              darts,
              complete: services.previewCricketVisit.execute({ state, darts }).complete,
            }
          },
        }
      }
      case 'TOUR_DU_MONDE': {
        const config = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })
        const id = await services.playTourDuMonde.start({ playerIds: joueurs, config })
        const volees = [[S20, Dart.single(19), Dart.miss()], RATE, [Dart.bull()], RATE]
        for (const darts of volees) await services.playTourDuMonde.recordVisit(id, darts)
        expect((await services.playTourDuMonde.getState(id)).finished).toBe(true)
        return {
          id,
          rouvrir: async () => {
            if ((await services.playTourDuMonde.getState(id)).history.length === 0) return null
            const { state, darts } = await services.playTourDuMonde.undoLastVisit(id)
            const apercu = services.previewTourDuMondeVisit.execute({ state, darts })
            return { darts, complete: apercu.complete || apercu.completesTour }
          },
        }
      }
      case 'KILLER': {
        // Kevin a le 8, Julien le 14 : killer, une vie, puis l'élimination qui gagne.
        const id = await services.playKiller.start({
          playerIds: joueurs,
          config: KillerConfig.create({ selfHitCostsLives: true }),
          numbers: [8, 14],
        })
        const volees = [[Dart.double(8), Dart.single(14), Dart.miss()], RATE, [Dart.double(14)]]
        for (const darts of volees) await services.playKiller.recordVisit(id, darts)
        expect((await services.playKiller.getState(id)).finished).toBe(true)
        return {
          id,
          rouvrir: async () => {
            if ((await services.playKiller.getState(id)).history.length === 0) return null
            const { state, darts } = await services.playKiller.undoLastVisit(id)
            return {
              darts,
              complete: services.previewKillerVisit.execute({ state, darts }).complete,
            }
          },
        }
      }
      case 'CHECKOUT_PRACTICE': {
        const [playerId] = joueurs
        if (!playerId) throw new Error('un joueur attendu')
        const id = await services.playCheckoutPractice.start({
          playerId,
          config: CheckoutPracticeConfig.create({ rounds: 3 }),
        })
        const viser = async () => (await services.playCheckoutPractice.getState(id)).current?.target
        await services.playCheckoutPractice.recordVisit(id, [S1, S1, S1])
        // Bust : trois T20 depuis un reste de 41 à 170 crèvent forcément.
        await services.playCheckoutPractice.recordVisit(id, [T20, T20, T20])
        const reste = (await viser()) ?? 0
        const route = services.getCheckoutSuggestion.execute({
          remaining: reste,
          dartsLeft: 3,
          config: { doubleOut: true },
        })
        if (!route) throw new Error('reste jouable attendu')
        await services.playCheckoutPractice.recordVisit(id, route)
        const fin = await services.playCheckoutPractice.getState(id)
        expect(fin.finished).toBe(true)
        expect(fin.rounds.map((round) => round.outcome)).toEqual(['SCORED', 'BUSTED', 'CHECKOUT'])
        return {
          id,
          rouvrir: async () => {
            if ((await services.playCheckoutPractice.getState(id)).roundsPlayed === 0) return null
            const { state, darts } = await services.playCheckoutPractice.undoLastVisit(id)
            const cible = state.current?.target ?? 0
            const issue = resolveVisit({ doubleOut: true, doubleIn: false }, cible, true, darts)
            return { darts, complete: darts.length >= 3 || issue.outcome !== 'SCORED' }
          },
        }
      }
    }
  }

  it('remonte tout le journal sans jamais rouvrir une volée complète', async () => {
    const { services } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const julien = (await services.managePlayers.create('Julien')).id
    const { rouvrir } = await jouer(services, [kevin, julien])

    let rouvertes = 0
    for (let rouverte = await rouvrir(); rouverte !== null; rouverte = await rouvrir()) {
      expect(rouverte.darts.length).toBeLessThan(3)
      expect(rouverte.complete).toBe(false)
      rouvertes += 1
    }
    // Le scénario a bien été remonté en entier (garde contre un test vide).
    expect(rouvertes).toBeGreaterThanOrEqual(3)
  })
})
