import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/games/x01/config'
import { DartboardHits } from '@/core/domain/services/dartboardHits'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'

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

/**
 * Un instant en heure **locale**, construit comme le use case le lira.
 *
 * ⚠️ Écrire les bornes en UTC rendrait ces tests dépendants du fuseau de la
 * machine : « aujourd'hui » se compte depuis minuit *local*, et à Sydney comme
 * à Papeete ce n'est pas le même instant.
 */
const local = (annee: number, mois: number, jour: number, heure: number): number =>
  new Date(annee, mois, jour, heure).getTime()

describe('Statistiques par période', () => {
  const CE_SOIR = local(2026, 7, 26, 21)
  const IL_Y_A_QUATRE_JOURS = local(2026, 7, 22, 20)
  const LE_MOIS_DERNIER = local(2026, 6, 10, 20)

  let horloge: SettableClock
  let services: Services
  let kevin: PlayerId

  const jouerLe = async (instant: number) => {
    horloge.regler(instant)
    const matchId = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ startingScore: 501, legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })
  }

  const partiesVues = async (periode?: Parameters<Services['getPlayerStats']['execute']>[0]) =>
    (await services.getPlayerStats.execute(periode))[0]?.matchesPlayed ?? 0

  beforeEach(async () => {
    horloge = new SettableClock(CE_SOIR)
    services = fakeServices({ clock: horloge }).services
    kevin = (await services.managePlayers.create('Kevin')).id

    await jouerLe(LE_MOIS_DERNIER)
    await jouerLe(IL_Y_A_QUATRE_JOURS)
    await jouerLe(CE_SOIR)
    horloge.regler(CE_SOIR)
  })

  it('ne garde que la soirée en cours sur « aujourd’hui »', async () => {
    expect(await partiesVues('TODAY')).toBe(1)
  })

  it('remonte à minuit, pas aux dernières 24 heures', async () => {
    // Une partie de ce matin compte encore pour « aujourd'hui » le soir venu :
    // c'est bien la journée qu'on regarde, pas une fenêtre glissante.
    await jouerLe(local(2026, 7, 26, 9))
    horloge.regler(CE_SOIR)

    expect(await partiesVues('TODAY')).toBe(2)
  })

  it('prend les 7 et les 30 derniers jours, bornes comprises', async () => {
    expect(await partiesVues('LAST_7_DAYS')).toBe(2)
    expect(await partiesVues('LAST_30_DAYS')).toBe(2)
  })

  it('prend tout par défaut, comme avant le filtre', async () => {
    expect(await partiesVues('ALL_TIME')).toBe(3)
    expect(await partiesVues()).toBe(3)
  })

  it('ne renvoie aucun joueur quand la période est vide', async () => {
    // ⚠️ Une liste vide, et non un joueur à zéro : l'écran doit pouvoir dire
    // « rien ce soir » plutôt qu'afficher des tableaux de zéros.
    horloge.regler(local(2026, 8, 30, 21))

    expect(await services.getPlayerStats.execute('TODAY')).toEqual([])
    expect(await services.getPlayerStats.execute('ALL_TIME')).toHaveLength(1)
  })

  it('classe une partie sur son ouverture, pas sur sa dernière volée', async () => {
    // Une partie commencée à 23h50 et finie à 00h10 s'est jouée ce soir-là :
    // la couper en deux ne rendrait service à personne.
    horloge.regler(local(2026, 7, 25, 23))
    const matchId = await services.startMatch.execute({
      playerIds: [kevin],
      config: X01Config.create({ legsToWin: 1 }),
    })

    horloge.regler(CE_SOIR)
    await services.recordVisit.execute({ matchId, darts: T20 })

    // Touchée aujourd'hui, mais ouverte hier : elle reste sur hier.
    expect(await partiesVues('TODAY')).toBe(1)
    expect(await partiesVues('LAST_7_DAYS')).toBe(3)
  })
})

describe('Carte des impacts (use case)', () => {
  it('rattache chaque fléchette à celui qui l’a lancée', async () => {
    const services = fakeServices().services
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    // ⚠️ Le journal ne dit pas à qui est la volée (`VisitRecorded` n'a pas de
    // `playerId`) : c'est la projection qui l'attribue. Ce test le vérifie.
    await services.recordVisit.execute({ matchId, darts: T20 })
    await services.recordVisit.execute({ matchId, darts: [Dart.double(16), Dart.miss()] })

    const stats = await services.getPlayerStats.execute()
    const carte = (id: string) => stats.find((joueur) => joueur.playerId === id)?.hits

    const deKevin = carte(kevin.id)
    expect(deKevin?.busiest).toBe(3)
    expect(DartboardHits.top(deKevin ?? DartboardHits.empty(), 1)).toEqual([
      { segment: 20, multiplier: 'TRIPLE', hits: 3 },
    ])
    expect(deKevin?.missed).toBe(0)

    const deJulien = carte(julien.id)
    expect(DartboardHits.top(deJulien ?? DartboardHits.empty(), 1)).toEqual([
      { segment: 16, multiplier: 'DOUBLE', hits: 1 },
    ])
    // La manquée a bien été lancée : elle compte, sans chauffer de case.
    expect(deJulien?.missed).toBe(1)
    expect(deJulien?.total).toBe(2)
  })

  it('compte la fléchette qui fait bust : elle a bien été lancée', async () => {
    const services = fakeServices().services
    const kevin = await services.managePlayers.create('Kevin')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ startingScore: 301, legsToWin: 1 }),
    })
    // 301 → 121 → un T20 de trop passerait sous zéro : la volée est annulée,
    // mais les trois fléchettes ont bien touché le plateau.
    await services.recordVisit.execute({ matchId, darts: T20 })
    await services.recordVisit.execute({ matchId, darts: [Dart.triple(20), Dart.triple(20)] })

    const stats = await services.getPlayerStats.execute()

    expect(stats[0]?.hits.total).toBe(5)
    expect(stats[0]?.dartsThrown).toBe(5)
  })

  it('expose les 62 cases même quand une seule a été touchée', async () => {
    // L'UI dessine un plateau complet : elle a besoin des cases froides autant
    // que des chaudes, sinon la carte aurait des trous plutôt que du vide.
    const services = fakeServices().services
    const kevin = await services.managePlayers.create('Kevin')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create({ legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: T20 })

    const stats = await services.getPlayerStats.execute()
    expect(stats[0]?.hits.zones).toHaveLength(62)
  })
})
