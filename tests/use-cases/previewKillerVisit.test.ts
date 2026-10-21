import { describe, expect, it } from 'vitest'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { KillerRules } from '@/core/domain/games/killer/rules'
import { Dart } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

const KEVIN = PlayerId.of('kevin')
const JULIEN = PlayerId.of('julien')
const SARAH = PlayerId.of('sarah')

const depart = (selfHitCostsLives = false, joueurs = [KEVIN, JULIEN, SARAH]) =>
  KillerRules.start({
    type: 'KillerStarted',
    config: KillerConfig.create({ selfHitCostsLives }),
    playerIds: joueurs,
    numbers: [8, 14, 3].slice(0, joueurs.length) as [8, 14, 3],
    startingPlayerIndex: 0,
  })

describe('PreviewKillerVisit — l’aperçu pendant la volée', () => {
  const { services } = fakeServices()
  const apercu = (state: ReturnType<typeof depart>, darts: readonly Dart[]) =>
    services.previewKillerVisit.execute({ state, darts })

  it('sans fléchette : l’état tel quel, ouvert, sans volée', () => {
    const state = depart()
    expect(apercu(state, [])).toEqual({ state, complete: false, visit: null })
  })

  it('suit chaque fléchette : killer puis vie retirée, avant tout enregistrement', () => {
    const resultat = apercu(depart(), [Dart.double(8), Dart.single(14)])

    expect(resultat.complete).toBe(false)
    expect(resultat.state.players[0]?.killer).toBe(true)
    expect(resultat.state.players[1]?.lives).toBe(2)
    expect(resultat.visit?.effects.map((e) => e.type)).toEqual(['BECAME_KILLER', 'HIT'])
  })

  it('close à 3 fléchettes, sur la fléchette gagnante, et sur l’auto-élimination', () => {
    expect(apercu(depart(), [Dart.miss(), Dart.miss(), Dart.miss()]).complete).toBe(true)
    expect(apercu(depart(false, [KEVIN, JULIEN]), [Dart.double(8), Dart.triple(14)]).complete).toBe(
      true,
    )
    const auto = apercu(depart(true), [Dart.double(8), Dart.triple(8)])
    expect(auto.complete).toBe(true)
    expect(auto.state.finished).toBe(false)
  })

  it('l’aperçu égale l’enregistrement (même `applyVisit`)', async () => {
    const { services: s } = fakeServices()
    const kevin = (await s.managePlayers.create('Kevin')).id
    const julien = (await s.managePlayers.create('Julien')).id
    const id = await s.playKiller.start({
      playerIds: [kevin, julien],
      config: KillerConfig.create(),
      numbers: [8, 14],
    })
    const avant = await s.playKiller.getState(id)
    const darts = [Dart.double(8), Dart.single(14), Dart.double(14)]

    const vu = s.previewKillerVisit.execute({ state: avant, darts })
    const enregistre = await s.playKiller.recordVisit(id, darts)

    expect(enregistre.state).toEqual(vu.state)
    expect(await s.playKiller.getState(id)).toEqual(vu.state)
  })
})
