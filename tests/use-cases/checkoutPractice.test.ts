import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { DomainError } from '@/core/domain/DomainError'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { BOGEY_NUMBERS } from '@/core/domain/services/checkout'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Entraînement au checkout (use case)', () => {
  let services: Services
  let kevin: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
  })

  const demarrer = (rounds = 3) =>
    services.playCheckoutPractice.start({
      playerId: kevin,
      config: CheckoutPracticeConfig.create({ rounds }),
    })

  it('ouvre déjà une première cible : on a toujours quelque chose à viser', async () => {
    const state = await services.playCheckoutPractice.getState(await demarrer())

    expect(state.current).not.toBeNull()
    expect(state.current?.target).toBeGreaterThanOrEqual(41)
    expect(state.current?.target).toBeLessThanOrEqual(170)
    expect(state.roundsPlayed).toBe(0)
  })

  it('enchaîne les manches jusqu’au compte demandé, puis s’arrête', async () => {
    const id = await demarrer(2)

    const premiere = await services.playCheckoutPractice.recordVisit(id, RATE)
    expect(premiere.state.finished).toBe(false)
    expect(premiere.state.current).not.toBeNull()

    const seconde = await services.playCheckoutPractice.recordVisit(id, RATE)
    expect(seconde.state.finished).toBe(true)
    expect(seconde.state.current).toBeNull()
    expect(seconde.state.roundsPlayed).toBe(2)
  })

  it('remonte l’issue de la manche qu’on vient de jouer', async () => {
    const id = await demarrer()
    const cible = (await services.playCheckoutPractice.getState(id)).current?.target ?? 0

    // On sort pile la cible : le domaine sait que c'est réussi.
    const sortie = await services.playCheckoutPractice.recordVisit(
      id,
      Dart.points(Dart.double(20)) === cible ? [Dart.double(20)] : RATE,
    )

    expect(['CHECKOUT', 'SCORED', 'BUSTED']).toContain(sortie.outcome)
    expect(sortie.state.roundsPlayed).toBe(1)
  })

  /** Ne jamais proposer un reste qu'on ne peut pas finir en trois fléchettes. */
  it('ne tire jamais un bogey number, sur toute une session', async () => {
    const id = await demarrer(30)

    const cibles: number[] = []
    for (let manche = 0; manche < 30; manche += 1) {
      const state = await services.playCheckoutPractice.getState(id)
      if (state.current) cibles.push(state.current.target)
      if (!state.finished) await services.playCheckoutPractice.recordVisit(id, RATE)
    }

    expect(cibles).toHaveLength(30)
    for (const bogey of BOGEY_NUMBERS) expect(cibles).not.toContain(bogey)
  })

  /**
   * Le piège qu'on veut éviter : annuler pour retomber sur une cible plus
   * facile. Les tirages étant dans le journal, l'annulation les rend tels quels.
   */
  it('redonne exactement la même cible après une annulation', async () => {
    const id = await demarrer()
    const avant = (await services.playCheckoutPractice.getState(id)).current?.target

    await services.playCheckoutPractice.recordVisit(id, RATE)
    const { state: apresUndo } = await services.playCheckoutPractice.undoLastVisit(id)

    expect(apresUndo.current?.target).toBe(avant)
    expect(apresUndo.roundsPlayed).toBe(0)
  })

  it('refuse d’annuler quand rien n’a été joué', async () => {
    const id = await demarrer()

    await expect(services.playCheckoutPractice.undoLastVisit(id)).rejects.toThrow(DomainError)
  })

  it('refuse de démarrer pour un joueur inconnu', async () => {
    await expect(
      services.playCheckoutPractice.start({
        playerId: 'fantome' as PlayerId,
        config: CheckoutPracticeConfig.create(),
      }),
    ).rejects.toThrow(DomainError)
  })

  it('apparaît dans l’historique sans fausser les statistiques X01', async () => {
    const id = await demarrer(1)
    await services.playCheckoutPractice.recordVisit(id, RATE)

    const historique = await services.getMatchHistory.execute()
    expect(historique).toHaveLength(1)
    expect(historique[0]?.mode).toBe('CHECKOUT_PRACTICE')
    // Pas d'adversaire, donc pas de vainqueur.
    expect(historique[0]?.winnerId).toBeNull()

    // Moyennes et 180 n'ont pas de sens ici : la carrière X01 reste vide.
    expect(await services.getPlayerStats.execute()).toEqual([])
  })
})
