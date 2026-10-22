import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'
import { lancer } from './lancerPartie'

const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
const RIEN = [Dart.miss(), Dart.miss(), Dart.miss()]

/**
 * Un instant en heure **locale**, construit comme le use case le lira
 * (`test.env.TZ = 'Europe/Paris'`).
 */
const local = (annee: number, mois: number, jour: number, heure: number): number =>
  new Date(annee, mois, jour, heure).getTime()

const CE_SOIR = local(2026, 7, 26, 21)
const IL_Y_A_QUATRE_JOURS = local(2026, 7, 22, 20)
const LE_MOIS_DERNIER = local(2026, 6, 10, 20)

describe('Carte Évolution (use case GetPlayerProgress)', () => {
  let horloge: SettableClock
  let services: Services
  let kevin: PlayerId

  const ouvrir = async (playerIds: readonly PlayerId[], instant: number): Promise<MatchId> => {
    horloge.regler(instant)
    return services.startMatch.execute({
      playerIds,
      config: X01Config.create({ startingScore: 501, legsToWin: 1 }),
    })
  }

  const volee = (matchId: MatchId, darts: readonly Dart[], instant = horloge.now()) => {
    horloge.regler(instant)
    return services.recordVisit.execute({ matchId, darts })
  }

  const courbe = async (period?: StatsPeriod, playerId: PlayerId = kevin) =>
    (await services.getPlayerProgress.execute(period)).find(
      (progres) => progres.playerId === playerId,
    )

  beforeEach(async () => {
    horloge = new SettableClock(CE_SOIR)
    services = fakeServices({ clock: horloge }).services
    kevin = (await services.managePlayers.create('Kevin')).id
  })

  it('ne renvoie rien sans partie', async () => {
    expect(await services.getPlayerProgress.execute()).toEqual([])
  })

  it('suit les mêmes périodes que le podium', async () => {
    for (const instant of [LE_MOIS_DERNIER, IL_Y_A_QUATRE_JOURS, CE_SOIR]) {
      await volee(await ouvrir([kevin], instant), T20)
    }
    horloge.regler(CE_SOIR)

    for (const periode of ['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'ALL_TIME'] as const) {
      const podium = (await services.getPlayerStats.execute(periode))[0]?.matchesPlayed
      expect((await courbe(periode))?.points.length).toBe(podium)
    }
    expect((await courbe())?.points).toHaveLength(3)
  })

  it('range et filtre sur l’ouverture (createdAt), jamais sur la dernière volée', async () => {
    const hier = await ouvrir([kevin], local(2026, 7, 25, 23))
    const ceSoir = await ouvrir([kevin], CE_SOIR)
    await volee(ceSoir, T20, CE_SOIR)
    // La partie d'hier est touchée en dernier : le dépôt la rend en tête.
    await volee(hier, RIEN, local(2026, 7, 26, 22))

    const tout = await courbe('ALL_TIME')
    expect(tout?.points.map((point) => point.matchId)).toEqual([hier, ceSoir])

    // Touchée aujourd'hui, mais ouverte hier : elle reste sur hier.
    const aujourdhui = await courbe('TODAY')
    expect(aujourdhui?.points.map((point) => point.matchId)).toEqual([ceSoir])
  })

  it('compte les parties en cours et abandonnées', async () => {
    const abandonnee = await ouvrir([kevin], IL_Y_A_QUATRE_JOURS)
    await volee(abandonnee, T20)
    const enCours = await ouvrir([kevin], CE_SOIR)
    await volee(enCours, T20)

    expect((await services.getOngoingMatch.execute())?.id).toBe(enCours)
    expect((await courbe())?.points.map((point) => point.matchId)).toEqual([abandonnee, enCours])
  })

  it.each(GAME_MODE_IDS.filter((mode): mode is Exclude<GameModeId, 'X01'> => mode !== 'X01'))(
    'ne trace que le X01 : une partie de %s n’y figure pas',
    async (mode) => {
      // ⚠️ Pas de solo au Killer : il lui faut au moins 2 joueurs.
      const joueurs =
        mode === 'KILLER' ? [kevin, (await services.managePlayers.create('Julien')).id] : [kevin]
      const autre = await lancer(services, mode, joueurs)
      switch (mode) {
        case 'KILLER':
          break
        case 'TOUR_DU_MONDE':
          await services.playTourDuMonde.recordVisit(autre, RIEN)
          break
        case 'CRICKET':
          await services.playCricket.recordVisit(autre, RIEN)
          break
        case 'CHECKOUT_PRACTICE':
          await services.playCheckoutPractice.recordVisit(autre, RIEN)
          break
      }
      const x01 = await ouvrir([kevin], CE_SOIR)
      await volee(x01, T20)

      expect((await courbe())?.points.map((point) => point.matchId)).toEqual([x01])
    },
  )

  it('ne donne pas de point au joueur qui n’a encore rien lancé', async () => {
    const julien = (await services.managePlayers.create('Julien')).id
    const matchId = await ouvrir([kevin, julien], CE_SOIR)
    await volee(matchId, T20)

    expect((await courbe(undefined, kevin))?.points).toHaveLength(1)
    expect(await courbe(undefined, julien)).toBeUndefined()
    // Le podium, lui, compte la partie pour Julien (R2 de l'architecture).
    const podium = await services.getPlayerStats.execute()
    expect(podium.find((joueur) => joueur.playerId === julien)?.matchesPlayed).toBe(1)
  })

  it('garde la courbe d’un profil supprimé', async () => {
    await volee(await ouvrir([kevin], CE_SOIR), T20)
    await services.managePlayers.remove(kevin)

    expect((await courbe())?.points).toHaveLength(1)
  })

  it('le dernier point, sur une période d’une partie, est exactement la carte Moyenne du podium', async () => {
    await volee(await ouvrir([kevin], LE_MOIS_DERNIER), T20)
    const ceSoir = await ouvrir([kevin], CE_SOIR)
    await volee(ceSoir, [Dart.single(20), Dart.triple(19), Dart.single(1)])
    await volee(ceSoir, [Dart.triple(17), Dart.single(5), Dart.miss()])
    horloge.regler(CE_SOIR)

    const podium = (await services.getPlayerStats.execute('TODAY'))[0]
    const progres = await courbe('TODAY')

    expect(progres?.points).toHaveLength(1)
    expect(progres?.points.at(-1)?.value.average3).toBe(podium?.average3)
    expect(progres?.points.at(-1)?.value.first9Average).toBe(podium?.first9Average)
    expect(progres?.reference.average3).toBe(podium?.average3)
  })

  it('la ligne pointillée est exactement la moyenne du podium sur la période', async () => {
    const premiere = await ouvrir([kevin], LE_MOIS_DERNIER)
    await volee(premiere, T20)
    await volee(premiere, [Dart.single(1), Dart.miss(), Dart.miss()])
    await volee(await ouvrir([kevin], IL_Y_A_QUATRE_JOURS), [Dart.single(19), Dart.single(7)])
    await volee(await ouvrir([kevin], CE_SOIR), [Dart.triple(20), Dart.single(3), Dart.miss()])
    horloge.regler(CE_SOIR)

    const podium = (await services.getPlayerStats.execute('ALL_TIME'))[0]
    const progres = await courbe('ALL_TIME')

    expect(progres?.reference.average3).toBe(podium?.average3)
    expect(progres?.reference.first9Average).toBe(podium?.first9Average)
  })
})
