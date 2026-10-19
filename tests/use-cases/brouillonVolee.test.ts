import { describe, expect, it } from 'vitest'
import type { Dependencies, Services } from '@/composition/container'
import type { ReopenedVisit } from '@/core/application/ports/driving/ReopenedVisit'
import { DomainError } from '@/core/domain/DomainError'
import { type AnyMatchState, GAME_MODE_IDS, type GameModeId, GameModes } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId, type PlayerId } from '@/core/domain/value-objects/ids'
import { BrouillonsIndelebiles, BrouillonsSuspendus, DepotCompteur, fakeServices } from '../fakes'
import { lancer } from './lancerPartie'

/**
 * Lot `volee-partielle` : la volée en cours vit dans un brouillon hors du
 * journal, estampillé avec le nombre de volées de l'état affiché. Il n'est
 * rendu que s'il est cohérent avec le journal ; sinon il est effacé.
 */

const M = Dart.miss()
const S1 = Dart.single(1)

const banc = (surcharges: Partial<Dependencies> = {}) => {
  const { services, dependencies } = fakeServices(surcharges)
  return { services, dependencies }
}

/** Kevin et Julien, créés une fois par jeu de services (un pseudo ne se prend pas deux fois). */
const profils = new WeakMap<Services, readonly PlayerId[]>()

const joueurs = async (services: Services, mode: GameModeId): Promise<readonly PlayerId[]> => {
  let ids = profils.get(services)
  if (!ids) {
    ids = [
      (await services.managePlayers.create('Kevin')).id,
      (await services.managePlayers.create('Julien')).id,
    ]
    profils.set(services, ids)
  }
  return mode === 'CHECKOUT_PRACTICE' ? ids.slice(0, 1) : ids
}

const partie = async (services: Services, mode: GameModeId) =>
  lancer(services, mode, await joueurs(services, mode))

/** L'état rejoué depuis le dépôt : ce que l'écran chargerait. */
const etat = async (dependencies: Dependencies, id: MatchId): Promise<AnyMatchState> => {
  const record = await dependencies.matches.findById(id)
  if (!record) throw new Error('partie introuvable')
  return GameModes.project(record.events)
}

/** Une volée enregistrée, par le port du mode (aucune règle recopiée). */
const jouer = async (
  services: Services,
  mode: GameModeId,
  id: MatchId,
  darts: readonly Dart[],
): Promise<void> => {
  switch (mode) {
    case 'X01':
      await services.recordVisit.execute({ matchId: id, darts })
      return
    case 'TOUR_DU_MONDE':
      await services.playTourDuMonde.recordVisit(id, darts)
      return
    case 'CRICKET':
      await services.playCricket.recordVisit(id, darts)
      return
    case 'CHECKOUT_PRACTICE':
      await services.playCheckoutPractice.recordVisit(id, darts)
      return
  }
}

const annulerVolee = (
  services: Services,
  mode: GameModeId,
  id: MatchId,
): Promise<ReopenedVisit<AnyMatchState>> => {
  switch (mode) {
    case 'X01':
      return services.undoLastVisit.execute(id)
    case 'TOUR_DU_MONDE':
      return services.playTourDuMonde.undoLastVisit(id)
    case 'CRICKET':
      return services.playCricket.undoLastVisit(id)
    case 'CHECKOUT_PRACTICE':
      return services.playCheckoutPractice.undoLastVisit(id)
  }
}

describe('Brouillon de volée — aller-retour (les quatre modes)', () => {
  it.each(GAME_MODE_IDS)(
    '%s : une ou deux fléchettes écrites sont rendues telles quelles',
    async (mode) => {
      const { services, dependencies } = banc()
      const id = await partie(services, mode)
      const base = await etat(dependencies, id)

      await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
      expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([S1])

      await services.manageVisitDraft.save({ matchId: id, base, darts: [S1, M] })
      expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([S1, M])
      // Une ligne par partie, estampillée avec le nombre de volées de l'état affiché.
      expect(await dependencies.visitDrafts.findById(id)).toEqual({
        matchId: id,
        visitCount: 0,
        darts: [S1, M],
      })
    },
  )

  it.each(GAME_MODE_IDS)(
    '%s : une volée enregistrée rend le brouillon périmé, il est effacé',
    async (mode) => {
      const { services, dependencies } = banc()
      const id = await partie(services, mode)
      const avant = await etat(dependencies, id)
      await services.manageVisitDraft.save({ matchId: id, base: avant, darts: [M, M] })
      expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

      await jouer(services, mode, id, [M, M, M])
      const apres = await etat(dependencies, id)
      expect(GameModes.visitCount(apres)).toBe(1)

      expect(await services.manageVisitDraft.restore({ matchId: id, base: apres })).toEqual([])
      expect(await dependencies.visitDrafts.findById(id)).toBeNull()
    },
  )

  it.each(GAME_MODE_IDS)(
    '%s : la volée rouverte par Annuler est rendue après rechargement',
    async (mode) => {
      const { services, dependencies } = banc()
      const id = await partie(services, mode)
      await jouer(services, mode, id, [S1, M, M])

      const { state: revenu, darts } = await annulerVolee(services, mode, id)
      expect(darts).toEqual([S1, M])
      await services.manageVisitDraft.save({ matchId: id, base: revenu, darts })

      // Rechargement : l'état est rejoué depuis le dépôt, pas repris de la mémoire.
      const recharge = await etat(dependencies, id)
      expect(await services.manageVisitDraft.restore({ matchId: id, base: recharge })).toEqual([
        S1,
        M,
      ])
    },
  )

  it.each(GAME_MODE_IDS)('%s : save([]) efface le brouillon', async (mode) => {
    const { services, dependencies } = banc()
    const id = await partie(services, mode)
    const base = await etat(dependencies, id)
    await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    await services.manageVisitDraft.save({ matchId: id, base, darts: [] })

    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
  })

  it.each(GAME_MODE_IDS)(
    '%s : quatre fléchettes ne sont pas une volée (DomainError)',
    async (mode) => {
      const { services, dependencies } = banc()
      const id = await partie(services, mode)
      const base = await etat(dependencies, id)

      await expect(
        services.manageVisitDraft.save({ matchId: id, base, darts: [M, M, M, M] }),
      ).rejects.toThrow(DomainError)
      expect(await dependencies.visitDrafts.findById(id)).toBeNull()
    },
  )
})

describe('Brouillon de volée — écarté et effacé quand il ne colle pas au journal', () => {
  /** Un brouillon posé directement dans le dépôt, tel qu'un disque pourrait le rendre. */
  const poserBrut = async (dependencies: Dependencies, matchId: MatchId, brouillon: object) =>
    dependencies.visitDrafts.save({ matchId, visitCount: 0, darts: [S1], ...brouillon } as never)

  it('partie terminée : rien n’est rendu, le brouillon est effacé', async () => {
    const { services, dependencies } = banc()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const id = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })
    const base = await etat(dependencies, id)
    expect(GameModes.isFinished(base)).toBe(true)
    await poserBrut(dependencies, id, { visitCount: 1 })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('partie inconnue (supprimée hors use case) : rien n’est rendu, le brouillon est effacé', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    const fantome = MatchId.of('fantome')
    await poserBrut(dependencies, fantome, {})
    expect(await dependencies.visitDrafts.findById(fantome)).not.toBeNull()

    expect(await services.manageVisitDraft.restore({ matchId: fantome, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(fantome)).toBeNull()
  })

  it.each(GAME_MODE_IDS)('%s : un visitCount différent du journal est périmé', async (mode) => {
    const { services, dependencies } = banc()
    const id = await partie(services, mode)
    const base = await etat(dependencies, id)
    await poserBrut(dependencies, id, { visitCount: 5 })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('un état chargé en retard sur le journal (cache périmé) n’accepte aucun brouillon', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const ancien = await etat(dependencies, id)
    await jouer(services, 'X01', id, [M, M, M])
    const actuel = await etat(dependencies, id)
    await services.manageVisitDraft.save({ matchId: id, base: actuel, darts: [S1] })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    // Brouillon et journal d'accord, mais l'écran affiche encore l'état d'avant.
    expect(await services.manageVisitDraft.restore({ matchId: id, base: ancien })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('un état chargé d’un autre mode n’accepte aucun brouillon', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const autre = await partie(services, 'CRICKET')
    await poserBrut(dependencies, id, {})
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    const base = await etat(dependencies, autre)
    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it.each([
    ['quatre fléchettes', { darts: [S1, S1, S1, S1] }],
    ['aucune fléchette', { darts: [] }],
    ['pas une liste', { darts: 'S1' }],
    ['un triple bulle', { darts: [{ segment: 'BULL', multiplier: 'TRIPLE' }] }],
    ['un secteur 25', { darts: [{ segment: 25, multiplier: 'SIMPLE' }] }],
    ['un multiplicateur inventé', { darts: [{ segment: 20, multiplier: 'QUADRUPLE' }] }],
  ])('%s : incohérent, rien n’est rendu, le brouillon est effacé', async (_, brouillon) => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    await poserBrut(dependencies, id, brouillon)
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('aucun brouillon : rien n’est rendu, sans erreur', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
  })

  it('journal illisible (la projection lève) : rien n’est rendu, sans erreur, le brouillon est effacé', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()
    // Un journal sans événement d'ouverture : `GameModes.project` lève.
    const record = await dependencies.matches.findById(id)
    if (!record) throw new Error('partie introuvable')
    await dependencies.matches.save({ ...record, events: [] })
    expect(() => GameModes.project([])).toThrow(DomainError)

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('un effacement qui rejette n’empêche pas d’écarter : rien n’est rendu, sans erreur', async () => {
    const visitDrafts = new BrouillonsIndelebiles()
    const { services, dependencies } = banc({ visitDrafts })
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    await poserBrut(dependencies, id, { visitCount: 5 })
    expect(await visitDrafts.findById(id)).not.toBeNull()

    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
    // Il reste sur le disque, toujours écarté : la prochaine fléchette l'écrasera.
    expect(await visitDrafts.findById(id)).toMatchObject({ visitCount: 5 })
    expect(await services.manageVisitDraft.restore({ matchId: id, base })).toEqual([])
  })
})

describe('Brouillon de volée — l’écriture ne relit pas le journal', () => {
  /**
   * La raison de la clé `visitCount` : l'estampille est l'état affiché au moment
   * du geste. Une écriture qui relirait le journal pourrait, terminée après
   * l'enregistrement de la volée, estampiller les anciennes fléchettes avec le
   * nouveau nombre de volées — et les rendre au joueur suivant.
   */
  it('save n’appelle le dépôt de parties à aucun moment', async () => {
    const matches = new DepotCompteur()
    const { services, dependencies } = banc({ matches })
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    const lectures = matches.lectures

    await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    await services.manageVisitDraft.save({ matchId: id, base, darts: [] })

    expect(matches.lectures).toBe(lectures)
  })

  it('save atteint le dépôt de brouillons sans attendre (aucun await avant)', async () => {
    const visitDrafts = new BrouillonsSuspendus()
    const { services, dependencies } = banc({ visitDrafts })
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    visitDrafts.suspendre()

    const ecriture = services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    // Synchrone : l'appel au dépôt a déjà eu lieu avant le premier `await`.
    expect(visitDrafts.ecritures).toBe(1)

    visitDrafts.liberer()
    await ecriture
    expect((await visitDrafts.findById(id))?.visitCount).toBe(0)
  })

  it('une écriture partie avant une volée enregistrée garde l’ancienne estampille', async () => {
    const { services, dependencies } = banc()
    const id = await partie(services, 'X01')
    const avant = await etat(dependencies, id)
    await jouer(services, 'X01', id, [M, M, M])
    // Écrite après coup, mais avec l'état affiché au moment du geste.
    await services.manageVisitDraft.save({ matchId: id, base: avant, darts: [M, M] })
    expect(await dependencies.visitDrafts.findById(id)).toMatchObject({ visitCount: 0 })

    const apres = await etat(dependencies, id)
    expect(await services.manageVisitDraft.restore({ matchId: id, base: apres })).toEqual([])
  })
})

describe('Brouillon de volée — suppression de la partie', () => {
  it.each(GAME_MODE_IDS)('%s : supprimer la partie efface son brouillon', async (mode) => {
    const { services, dependencies } = banc()
    const id = await partie(services, mode)
    const autre = await partie(services, mode)
    const base = await etat(dependencies, id)
    await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    await services.manageVisitDraft.save({ matchId: autre, base, darts: [S1] })
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    await services.deleteMatch.execute(id)

    expect(await dependencies.visitDrafts.findById(id)).toBeNull()
    expect(await dependencies.matches.findById(id)).toBeNull()
    // Seule la partie supprimée perd sa volée.
    expect(await dependencies.visitDrafts.findById(autre)).not.toBeNull()
  })

  /**
   * Q-T2, tranchée par l'utilisateur : l'effacement du brouillon passe avant la
   * suppression. S'il échoue, la partie reste et l'erreur remonte (l'écran dit
   * qu'elle n'a pas pu être supprimée) — jamais de brouillon orphelin.
   */
  it('un brouillon impossible à effacer : la partie n’est pas supprimée, l’erreur remonte', async () => {
    const { services, dependencies } = banc({ visitDrafts: new BrouillonsIndelebiles() })
    const id = await partie(services, 'X01')
    const base = await etat(dependencies, id)
    await services.manageVisitDraft.save({ matchId: id, base, darts: [S1] })
    // Précondition : la partie et son brouillon sont là avant la suppression.
    expect(await dependencies.matches.findById(id)).not.toBeNull()
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()

    await expect(services.deleteMatch.execute(id)).rejects.toThrow('disque plein')

    expect(await dependencies.matches.findById(id)).not.toBeNull()
    expect(await dependencies.visitDrafts.findById(id)).not.toBeNull()
  })
})
