import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'
import { lancer, ouverture } from './lancerPartie'

const base = async (clock = new SettableClock()) => {
  const { services, dependencies } = fakeServices({ clock })
  const kevin = (await services.managePlayers.create('Kevin')).id
  const julien = (await services.managePlayers.create('Julien')).id
  const joueurs = (mode: GameModeId) => (mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien])
  return { services, dependencies, joueurs, clock }
}

describe('Lancer une partie nommée — les quatre modes', () => {
  it.each(GAME_MODE_IDS)('%s : enregistre le nom tapé, sans les espaces autour', async (mode) => {
    const { services, dependencies, joueurs } = await base()
    const id = await lancer(services, mode, joueurs(mode), '  Finale des potes  ')

    expect(await ouverture(dependencies, id)).toMatchObject({ name: 'Finale des potes' })
  })

  it.each(GAME_MODE_IDS)('%s : sans nom tapé, l’ouverture n’a pas de clé `name`', async (mode) => {
    const { services, dependencies, joueurs } = await base()
    for (const nom of [undefined, '', '   ']) {
      const id = await lancer(services, mode, joueurs(mode), nom)
      expect('name' in (await ouverture(dependencies, id))).toBe(false)
    }
  })

  it.each(GAME_MODE_IDS)('%s : refuse un nom de 31 caractères, et n’écrit rien', async (mode) => {
    const { services, joueurs } = await base()

    await expect(lancer(services, mode, joueurs(mode), 'x'.repeat(31))).rejects.toThrow(DomainError)
    expect(await services.getMatchHistory.execute()).toHaveLength(0)
  })
})

describe('Lire le nom d’une partie', () => {
  it('l’historique rend le nom tapé, ou null', async () => {
    const { services, joueurs } = await base()
    await lancer(services, 'X01', joueurs('X01'), 'Finale')
    await lancer(services, 'CRICKET', joueurs('CRICKET'))

    const noms = (await services.getMatchHistory.execute()).map((partie) => partie.name)
    expect([...noms].sort()).toEqual(['Finale', null])
  })

  it('getMatchName rend le nom tapé et la date de création', async () => {
    const clock = new SettableClock(new Date(2026, 9, 11, 21, 0).getTime())
    const { services, joueurs } = await base(clock)
    const nommee = await lancer(services, 'TOUR_DU_MONDE', joueurs('TOUR_DU_MONDE'), 'Finale')
    const anonyme = await lancer(services, 'CHECKOUT_PRACTICE', joueurs('CHECKOUT_PRACTICE'))

    expect(await services.getMatchName.execute(nommee)).toEqual({
      name: 'Finale',
      createdAt: clock.now(),
    })
    expect(await services.getMatchName.execute(anonyme)).toEqual({
      name: null,
      createdAt: clock.now(),
    })
  })

  it('getMatchName refuse un identifiant inconnu', async () => {
    const { services } = await base()
    await expect(services.getMatchName.execute(MatchId.of('inconnu'))).rejects.toThrow(DomainError)
  })
})

describe('Le nom survit à la vie de la partie', () => {
  /** Critère 7 : un journal d'avant le lot, sans la clé, reste valide. */
  it('une partie d’avant le lot se lit sans nom, se projette et se relance', async () => {
    const { services, dependencies, joueurs } = await base()
    const [kevin, julien] = joueurs('X01')
    if (!kevin || !julien) throw new Error('joueurs attendus')
    const id = MatchId.of('ancienne')
    await dependencies.matches.save({
      id,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
      events: [
        {
          type: 'MatchStarted',
          config: X01Config.create({}),
          playerIds: [kevin, julien],
          startingPlayerIndex: 0,
        },
        { type: 'VisitRecorded', darts: [Dart.triple(20)] },
      ],
    })

    expect(await services.getMatchName.execute(id)).toEqual({
      name: null,
      createdAt: 1_700_000_000_000,
    })
    expect((await services.getMatchState.execute(id)).history).toHaveLength(1)
    const relance = await services.restartMatch.execute(id)
    expect('name' in (await ouverture(dependencies, relance))).toBe(false)
  })

  it('annuler une volée X01 garde le nom', async () => {
    const { services, joueurs } = await base()
    const id = await lancer(services, 'X01', joueurs('X01'), 'Finale')
    await services.recordVisit.execute({ matchId: id, darts: [Dart.triple(20)] })
    await services.undoLastVisit.execute(id)

    expect((await services.getMatchName.execute(id)).name).toBe('Finale')
  })

  it('annuler une volée d’entraînement (et sa manche tirée) garde le nom', async () => {
    const { services, joueurs } = await base()
    const id = await lancer(services, 'CHECKOUT_PRACTICE', joueurs('CHECKOUT_PRACTICE'), 'Matin')
    await services.playCheckoutPractice.recordVisit(id, [Dart.single(1)])
    await services.playCheckoutPractice.undoLastVisit(id)

    expect((await services.getMatchName.execute(id)).name).toBe('Matin')
  })
})
