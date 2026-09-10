import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

/** Trois cibles : un tour se boucle en une volée. */
const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

/**
 * Le port d’aperçu du Tour du monde, interrogé directement.
 *
 * Ce que l’écran ne peut pas dire aussi nettement : `complete` se lit sur la
 * volée que l’aperçu vient d’ajouter à `history`, **jamais** sur
 * `state.finished`. Au Tour du monde on finit le tour de table, donc les deux
 * sont structurellement disjoints — un copier-coller du Cricket passerait tous
 * les autres tests et casserait celui-ci.
 */
describe('PreviewTourDuMondeVisit (use case)', () => {
  let services: Services
  let kevin: PlayerId
  let julien: PlayerId

  beforeEach(async () => {
    services = fakeServices().services
    kevin = (await services.managePlayers.create('Kevin')).id
    julien = (await services.managePlayers.create('Julien')).id
  })

  const demarrer = (): Promise<MatchId> =>
    services.playTourDuMonde.start({ playerIds: [kevin, julien], config: COURT })

  it('ne prévoit rien tant qu’aucune fléchette n’est plantée', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [] })

    // Le domaine refuse une volée vide : il ne doit pas être appelé du tout.
    expect(apercu.state).toBe(state)
    expect(apercu.complete).toBe(false)
  })

  it('laisse la volée ouverte tant que le parcours n’est pas bouclé', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [Dart.single(20)] })

    expect(apercu.complete).toBe(false)
    // La progression suit quand même la fléchette, sans règle recopiée à l’écran.
    expect(apercu.state.players[0]?.targetIndex).toBe(1)
    expect(apercu.state.players[0]?.dartsThrown).toBe(1)
  })

  /** Le cas décisif du lot : volée close, partie en cours. */
  it('clôt la volée sur la fléchette qui boucle, alors que la partie continue', async () => {
    const id = await demarrer()
    // Kevin arrive sur la bulle, Julien joue pour lui rendre la main.
    await services.playTourDuMonde.recordVisit(id, [Dart.single(20), Dart.single(19), Dart.miss()])
    await services.playTourDuMonde.recordVisit(id, RATE)

    const state = await services.playTourDuMonde.getState(id)
    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: [Dart.bull()] })

    expect(apercu.complete).toBe(true)
    // ⚠️ La partie n’est PAS finie : le tour de table n’est pas bouclé.
    expect(apercu.state.finished).toBe(false)
    expect(apercu.state.lastRound).toBe(true)
    // Une seule fléchette de plus, pas trois.
    expect(apercu.state.players[0]?.dartsThrown).toBe(4)
  })

  it('clôt la volée à trois fléchettes même sans bouclage', async () => {
    const state = await services.playTourDuMonde.getState(await demarrer())

    const apercu = services.previewTourDuMondeVisit.execute({ state, darts: RATE })

    expect(apercu.complete).toBe(true)
    expect(apercu.state.players[0]?.targetIndex).toBe(0)
  })

  it('n’écrit rien : l’aperçu est un calcul, pas un enregistrement', async () => {
    const id = await demarrer()
    const state = await services.playTourDuMonde.getState(id)

    services.previewTourDuMondeVisit.execute({ state, darts: [Dart.single(20)] })

    expect((await services.playTourDuMonde.getState(id)).history).toHaveLength(0)
  })

  /**
   * Annulation et rejeu à froid — la classe de bug la plus coûteuse du projet.
   *
   * Depuis ce lot, une volée close sur la 1ʳᵉ fléchette part au journal avec
   * **une** fléchette, plus trois : `recordVisit` persiste les `darts` reçus,
   * pas la version tronquée par le domaine. Il faut donc vérifier que
   * l’annulation défait bien cet événement-là, et surtout que la **projection**
   * redonne l’état d’avant — pas seulement que l’objet en mémoire n’a pas bougé.
   */
  it('annule une volée close sur la première fléchette et se rejoue à froid', async () => {
    const id = await demarrer()
    await services.playTourDuMonde.recordVisit(id, [Dart.single(20), Dart.single(19), Dart.miss()])
    await services.playTourDuMonde.recordVisit(id, RATE)

    const avant = await services.playTourDuMonde.getState(id)
    expect(avant.players[0]?.targetIndex).toBe(2)
    expect(avant.players[0]?.dartsThrown).toBe(3)
    expect(avant.currentPlayerIndex).toBe(0)

    // Exactement ce que l’écran envoie désormais : une seule fléchette.
    const bouclage = await services.playTourDuMonde.recordVisit(id, [Dart.bull()])
    expect(bouclage.state.players[0]?.finishedInDarts).toBe(4)
    expect(bouclage.state.lastRound).toBe(true)

    // Le journal ne garde aucune fléchette fantôme : l’événement n’en porte qu’une.
    const journal = (await services.manageBackup.exportAll()).matches[0]?.events ?? []
    const dernier = journal.at(-1)
    if (dernier?.type !== 'VisitRecorded') throw new Error('dernier événement inattendu')
    expect(dernier.darts).toHaveLength(1)
    expect(dernier.darts[0]?.segment).toBe('BULL')

    const revenu = await services.playTourDuMonde.undoLastVisit(id)

    expect(revenu.players[0]?.targetIndex).toBe(2)
    expect(revenu.players[0]?.dartsThrown).toBe(3)
    expect(revenu.players[0]?.finishedInDarts).toBeNull()
    expect(revenu.lastRound).toBe(false)
    // La main revient à celui dont on vient d’annuler la volée.
    expect(revenu.currentPlayerIndex).toBe(0)
    // L’événement est retiré en bloc, quelle que soit sa taille.
    expect((await services.manageBackup.exportAll()).matches[0]?.events).toHaveLength(3)

    // Rejeu à froid : la projection repart du journal, elle ne relit pas la
    // mémoire. C’est elle qui fait foi si l’app est rouverte demain.
    const rejoue = await services.playTourDuMonde.getState(id)
    expect(rejoue).toEqual(avant)
    expect(rejoue).toEqual(revenu)
  })
})
