import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { DomainError } from '@/core/domain/DomainError'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/**
 * « On remet ça » — la relance à l'identique.
 *
 * Le test qui porte tout le lot : la relance doit passer par **les mêmes
 * contrôles** qu'un premier départ. C'est ce qui justifie que le use case
 * rappelle les lancements existants au lieu de recopier l'événement
 * d'ouverture dans un journal neuf.
 */
describe('Relancer une partie à l’identique', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
  })

  it('rejoue un X01 avec les mêmes joueurs, les mêmes règles et le même ordre', async () => {
    const config = X01Config.create({ startingScore: 301, legsToWin: 3, doubleIn: true })
    const ancienne = await services.startMatch.execute({
      playerIds: [julien, kevin],
      config,
      startingPlayerIndex: 1,
    })
    await services.recordVisit.execute({ matchId: ancienne, darts: [Dart.triple(20)] })

    const nouvelle = await services.restartMatch.execute(ancienne)
    const state = await services.getMatchState.execute(nouvelle)

    expect(nouvelle).not.toBe(ancienne)
    expect(state.config).toEqual(config)
    expect(state.players.map((joueur) => joueur.playerId)).toEqual([julien, kevin])
    // L'ordre de passage aussi : qui commence n'est jamais neutre.
    expect(state.startingPlayerIndex).toBe(1)
    // Journal vierge : on rejoue la même partie, on ne reprend pas la précédente.
    expect(state.history).toHaveLength(0)
    expect(state.players[0]?.remaining).toBe(301)
  })

  it('laisse la partie d’origine intacte', async () => {
    const ancienne = await services.startMatch.execute({
      playerIds: [kevin, julien],
      config: X01Config.create({}),
    })
    await services.recordVisit.execute({ matchId: ancienne, darts: [Dart.triple(20)] })

    await services.restartMatch.execute(ancienne)

    expect((await services.getMatchState.execute(ancienne)).history).toHaveLength(1)
  })

  /** La variante vit dans la config : elle doit voyager avec la relance. */
  it('rejoue un Cricket dans sa variante', async () => {
    const ancienne = await services.playCricket.start({
      playerIds: [kevin, julien],
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
    })

    const state = await services.playCricket.getState(await services.restartMatch.execute(ancienne))

    expect(state.config.variant).toBe('CUT_THROAT')
    expect(state.finished).toBe(false)
  })

  it('rejoue un Tour du monde', async () => {
    const ancienne = await services.playTourDuMonde.start({
      playerIds: [kevin, julien],
      config: TourDuMondeConfig.create(),
    })

    const state = await services.playTourDuMonde.getState(
      await services.restartMatch.execute(ancienne),
    )

    expect(state.mode).toBe('TOUR_DU_MONDE')
    expect(state.players).toHaveLength(2)
  })

  /**
   * ⚠️ Un entraînement relancé **retire ses cibles**. On refait le même
   * exercice, pas la même série : rejouer des restes qu'on connaît déjà
   * n'entraînerait plus personne. C'est la conséquence assumée de passer par
   * `PlayCheckoutPractice.start`, qui consulte `RandomSource`.
   */
  it('rejoue un entraînement avec une manche déjà ouverte', async () => {
    const ancienne = await services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create({ rounds: 3 }),
    })
    const cibleAncienne = (await services.playCheckoutPractice.getState(ancienne)).current?.target

    const state = await services.playCheckoutPractice.getState(
      await services.restartMatch.execute(ancienne),
    )

    expect(state.config.rounds).toBe(3)
    expect(state.roundsPlayed).toBe(0)
    // Une cible est bien tirée : une session s'ouvre toujours sur un reste à viser.
    expect(state.current).not.toBeNull()
    expect(state.current?.target).not.toBe(cibleAncienne)
  })

  /**
   * La raison d'être du choix d'implémentation : recopier l'ouverture aurait
   * relancé une partie avec un joueur qui n'existe plus, et l'écran de match
   * aurait affiché « Joueur supprimé » face à lui-même.
   */
  it('refuse de relancer si un joueur a été supprimé depuis', async () => {
    const ancienne = await services.startMatch.execute({
      playerIds: [kevin, julien],
      config: X01Config.create({}),
    })
    await services.managePlayers.remove(julien)

    await expect(services.restartMatch.execute(ancienne)).rejects.toThrow(DomainError)
  })

  it('refuse un identifiant inconnu', async () => {
    await expect(services.restartMatch.execute('inconnu' as MatchId)).rejects.toThrow(DomainError)
  })
})
