import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { GameModes, modeOf } from '@/core/domain/games'
import { KillerRules, type KillerState } from '@/core/domain/games/killer/rules'
import { Dart } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'
import {
  derniereVolee,
  JULIEN,
  jouer,
  joueur,
  journal,
  KEVIN,
  LEA,
  MARC,
  ouverture,
  PAUL,
  SARAH,
} from './helpers'

/**
 * Les règles du Killer, validées par l'utilisateur (`request.md`, règles 1 à
 * 12). Kevin a le 8, Julien le 14, Sarah le 3, Paul le 11, Léa le 17, Marc le 20.
 */

const A_TROIS = ouverture({ playerIds: [KEVIN, JULIEN, SARAH] })

describe('Killer — devenir killer (règle 4)', () => {
  it('le double de son propre numéro rend killer', () => {
    const etat = jouer(ouverture(), [[Dart.double(8)]])

    expect(joueur(etat, KEVIN).killer).toBe(true)
    expect(derniereVolee(etat).effects).toEqual([{ type: 'BECAME_KILLER', playerId: KEVIN }])
    expect(etat.milestones).toContainEqual({ type: 'BecameKiller', playerId: KEVIN })
  })

  it.each([
    ['simple', Dart.single(8)],
    ['triple', Dart.triple(8)],
  ])('un %s de son numéro ne rend pas killer', (_, dart) => {
    const etat = jouer(ouverture(), [[dart]])

    expect(joueur(etat, KEVIN).killer).toBe(false)
    expect(joueur(etat, KEVIN).lives).toBe(3)
    expect(derniereVolee(etat).effects).toEqual([{ type: 'NONE' }])
  })

  it('le double du numéro d’un autre ne rend pas killer', () => {
    expect(joueur(jouer(ouverture(), [[Dart.double(14)]]), KEVIN).killer).toBe(false)
  })

  it('les fléchettes suivantes de la même volée comptent tout de suite', () => {
    const etat = jouer(ouverture(), [[Dart.double(8), Dart.single(14)]])

    expect(joueur(etat, JULIEN).lives).toBe(2)
  })

  it('la fléchette qui précède le double ne compte pas', () => {
    const etat = jouer(ouverture(), [[Dart.single(14), Dart.double(8)]])

    expect(joueur(etat, JULIEN).lives).toBe(3)
    expect(joueur(etat, KEVIN).killer).toBe(true)
  })

  it('un killer qui retouche le double de son numéro ne change rien (variante désactivée)', () => {
    const etat = jouer(ouverture(), [[Dart.double(8), Dart.double(8)]])

    expect(joueur(etat, KEVIN).lives).toBe(3)
    expect(derniereVolee(etat).effects[1]).toEqual({ type: 'NONE' })
    expect(etat.milestones.filter((m) => m.type === 'BecameKiller')).toHaveLength(1)
  })
})

describe('Killer — frapper un adversaire (règles 5 et 6)', () => {
  it('un non-killer qui touche le numéro d’un adversaire ne lui retire rien', () => {
    const etat = jouer(ouverture(), [[Dart.triple(14), Dart.double(14), Dart.single(14)]])

    expect(joueur(etat, JULIEN).lives).toBe(3)
    expect(derniereVolee(etat).effects).toEqual([
      { type: 'NONE' },
      { type: 'NONE' },
      { type: 'NONE' },
    ])
  })

  it.each([
    ['simple', Dart.single(14), 1],
    ['double', Dart.double(14), 2],
    ['triple', Dart.triple(14), 3],
  ])('un killer retire au %s %i vie(s)', (_, dart, perte) => {
    const etat = jouer(ouverture({ config: { startingLives: 5 } }), [[Dart.double(8), dart]])

    expect(joueur(etat, JULIEN).lives).toBe(5 - perte)
    expect(derniereVolee(etat).effects[1]).toEqual({
      type: 'HIT',
      targetId: JULIEN,
      livesLost: perte,
      eliminated: false,
    })
  })

  it('plancher à 0 : un triple sur 1 vie n’en retire qu’une (« −1 », vies réellement perdues)', () => {
    // Julien à 1 vie : D8 puis D14 (−2), au tour suivant T14.
    const etat = jouer(ouverture({ playerIds: [KEVIN, JULIEN, SARAH] }), [
      [Dart.double(8), Dart.double(14), Dart.miss()],
      [Dart.miss(), Dart.miss(), Dart.miss()],
      [Dart.miss(), Dart.miss(), Dart.miss()],
      [Dart.triple(14)],
    ])

    expect(joueur(etat, JULIEN).lives).toBe(0)
    expect(joueur(etat, JULIEN).eliminated).toBe(true)
    expect(derniereVolee(etat).effects[0]).toEqual({
      type: 'HIT',
      targetId: JULIEN,
      livesLost: 1,
      eliminated: true,
    })
    expect(KillerRules.livesLostIn(derniereVolee(etat), JULIEN)).toBe(1)
  })

  it('un simple sur 2 vies n’élimine pas, le double suivant oui', () => {
    const base = ouverture({ playerIds: [KEVIN, JULIEN, SARAH] })
    const unSimple = jouer(base, [[Dart.double(8), Dart.single(14)]])
    expect(joueur(unSimple, JULIEN)).toMatchObject({ lives: 2, eliminated: false })

    const puisDouble = jouer(base, [[Dart.double(8), Dart.single(14), Dart.double(14)]])
    expect(joueur(puisDouble, JULIEN)).toMatchObject({ lives: 0, eliminated: true })
  })
})

describe('Killer — fléchettes sans effet (critère 7)', () => {
  it.each([
    ['MISS', Dart.miss()],
    ['bulle 25', Dart.bull()],
    ['bulle 50', Dart.bullseye()],
    ['numéro non attribué', Dart.triple(19)],
  ])('%s : aucun effet, même pour un killer', (_, dart) => {
    const etat = jouer(ouverture(), [[Dart.double(8), dart]])

    expect(derniereVolee(etat).effects[1]).toEqual({ type: 'NONE' })
    expect(etat.players.map((p) => p.lives)).toEqual([3, 3])
  })

  it('le double de la bulle ne rend personne killer', () => {
    expect(jouer(ouverture(), [[Dart.bullseye()]]).players.every((p) => !p.killer)).toBe(true)
  })
})

describe('Killer — élimination (règles 7 et 8)', () => {
  /** Kevin élimine Julien d'entrée (D8, T14) ; il reste Kevin et Sarah. */
  const juliEnElimine = () => jouer(A_TROIS, [[Dart.double(8), Dart.triple(14)]])

  it('à 0 vie, éliminé par le lanceur de la fléchette', () => {
    const etat = juliEnElimine()

    expect(joueur(etat, JULIEN)).toMatchObject({ lives: 0, eliminated: true })
    expect(etat.eliminations).toEqual([{ playerId: JULIEN, by: KEVIN }])
    expect(etat.milestones).toContainEqual({
      type: 'PlayerEliminated',
      playerId: JULIEN,
      by: KEVIN,
    })
    expect(etat.finished).toBe(false)
  })

  it('l’éliminé est sauté au tour de table', () => {
    const etat = juliEnElimine()
    expect(KillerRules.currentPlayer(etat).playerId).toBe(SARAH)

    const apresSarah = jouer(A_TROIS, [[Dart.double(8), Dart.triple(14)], [Dart.miss()]])
    expect(KillerRules.currentPlayer(apresSarah).playerId).toBe(KEVIN)
  })

  it('le numéro d’un éliminé ne vaut plus rien', () => {
    const etat = jouer(A_TROIS, [
      [Dart.double(8), Dart.triple(14)],
      [Dart.double(3), Dart.single(14)],
    ])

    expect(derniereVolee(etat).effects[1]).toEqual({ type: 'NONE' })
    expect(joueur(etat, JULIEN).lives).toBe(0)
  })

  it('sans éliminé, le tour passe au voisin', () => {
    const etat = jouer(A_TROIS, [[Dart.miss()]])
    expect(KillerRules.currentPlayer(etat).playerId).toBe(JULIEN)
  })
})

describe('Killer — victoire (règle 8)', () => {
  it('le dernier survivant gagne ; la volée s’arrête sur la fléchette qui élimine', () => {
    const etat = jouer(ouverture(), [[Dart.double(8), Dart.triple(14), Dart.single(3)]])

    expect(etat.finished).toBe(true)
    expect(etat.winnerId).toBe(KEVIN)
    expect(derniereVolee(etat).darts).toEqual([Dart.double(8), Dart.triple(14)])
    expect(derniereVolee(etat).effects).toHaveLength(2)
    expect(etat.milestones.at(-1)).toEqual({ type: 'MatchFinished', winnerId: KEVIN })
    expect(KillerRules.isFinished(etat)).toBe(true)
  })

  it('pas de victoire tant qu’il reste deux vivants', () => {
    const etat = jouer(A_TROIS, [[Dart.double(8), Dart.triple(14)]])
    expect([etat.finished, etat.winnerId]).toEqual([false, null])
  })

  it('refuse une volée après la fin de la partie', () => {
    const etat = jouer(ouverture(), [[Dart.double(8), Dart.triple(14)]])
    expect(() => KillerRules.applyVisit(etat, [Dart.miss()])).toThrow(DomainError)
  })

  it('une partie complète à 3 joueurs', () => {
    const etat = jouer(A_TROIS, [
      [Dart.double(8), Dart.triple(14)],
      [Dart.single(14), Dart.miss(), Dart.miss()],
      [Dart.triple(3)],
    ])

    expect(etat.winnerId).toBe(KEVIN)
    expect(etat.eliminations).toEqual([
      { playerId: JULIEN, by: KEVIN },
      { playerId: SARAH, by: KEVIN },
    ])
  })
})

describe('Killer — la variante « son propre numéro coûte des vies » (règle 12)', () => {
  const VARIANTE = { selfHitCostsLives: true } as const

  it.each([
    ['simple', Dart.single(8), 1],
    ['double', Dart.double(8), 2],
    ['triple', Dart.triple(8), 3],
  ])('désactivée : un killer qui touche son %s ne perd rien', (_, dart) => {
    const etat = jouer(ouverture(), [[Dart.double(8), dart]])
    // Précondition : Kevin est bien killer avant la fléchette.
    expect(joueur(etat, KEVIN).killer).toBe(true)
    expect(joueur(etat, KEVIN).lives).toBe(3)
    expect(derniereVolee(etat).effects[1]).toEqual({ type: 'NONE' })
  })

  /** Kevin killer, réduit à `vies` par ses propres fléchettes, puis Julien et Sarah passent. */
  const kevinA = (vies: 1 | 2) =>
    jouer(ouverture({ config: VARIANTE, playerIds: [KEVIN, JULIEN, SARAH] }), [
      [Dart.double(8), vies === 2 ? Dart.single(8) : Dart.double(8), Dart.miss()],
      [Dart.miss()],
      [Dart.miss()],
    ])

  it.each([1, 2] as const)(
    'activée : plancher sur soi, un T de son numéro à %i vie(s) ne retire que ce qui reste',
    (vies) => {
      const avant = kevinA(vies)
      expect(joueur(avant, KEVIN)).toMatchObject({ killer: true, lives: vies, eliminated: false })

      const etat = KillerRules.applyVisit(avant, [Dart.triple(8), Dart.single(14)])

      expect(derniereVolee(etat).effects).toEqual([
        { type: 'HIT', targetId: KEVIN, livesLost: vies, eliminated: true },
      ])
      expect(KillerRules.livesLostIn(derniereVolee(etat), KEVIN)).toBe(vies)
      expect(joueur(etat, KEVIN)).toMatchObject({ lives: 0, eliminated: true })
      expect(joueur(etat, JULIEN).lives).toBe(3)
    },
  )

  it.each([
    ['simple', 1, Dart.single(8)],
    ['double', 2, Dart.double(8)],
  ] as const)('activée : auto-élimination par un %s (à %i vie(s))', (_, vies, dart) => {
    const avant = kevinA(vies)
    expect(joueur(avant, KEVIN).eliminated).toBe(false)

    const etat = KillerRules.applyVisit(avant, [dart, Dart.triple(14)])

    expect(joueur(etat, KEVIN)).toMatchObject({ lives: 0, eliminated: true })
    // La volée s'arrête : le T14 n'est jamais joué.
    expect(derniereVolee(etat).darts).toEqual([dart])
    expect(joueur(etat, JULIEN).lives).toBe(3)
    expect(etat.eliminations).toEqual([{ playerId: KEVIN, by: KEVIN }])
    expect(KillerRules.currentPlayer(etat).playerId).toBe(JULIEN)
  })

  it.each([
    ['simple', Dart.single(8), 1],
    ['double', Dart.double(8), 2],
  ])('activée : un killer qui touche son %s perd %i vie(s)', (_, dart, perte) => {
    const etat = jouer(ouverture({ config: VARIANTE }), [[Dart.double(8), dart]])

    expect(joueur(etat, KEVIN).lives).toBe(3 - perte)
    expect(derniereVolee(etat).effects[1]).toMatchObject({ type: 'HIT', targetId: KEVIN })
  })

  it('activée : le double de son numéro avant d’être killer rend killer, sans perte', () => {
    const etat = jouer(ouverture({ config: VARIANTE }), [[Dart.double(8)]])

    expect(joueur(etat, KEVIN)).toMatchObject({ killer: true, lives: 3 })
  })

  it('activée : à 0 vie le lanceur est éliminé et sa volée s’arrête', () => {
    // Trois joueurs : Kevin se rend killer puis se met un triple (3 vies).
    const etat = jouer(ouverture({ config: VARIANTE, playerIds: [KEVIN, JULIEN, SARAH] }), [
      [Dart.double(8), Dart.triple(8), Dart.single(14)],
    ])

    expect(joueur(etat, KEVIN)).toMatchObject({ lives: 0, eliminated: true })
    expect(derniereVolee(etat).darts).toEqual([Dart.double(8), Dart.triple(8)])
    expect(joueur(etat, JULIEN).lives).toBe(3)
    expect(etat.eliminations).toEqual([{ playerId: KEVIN, by: KEVIN }])
    expect(
      KillerRules.visitIsOver(
        jouer(ouverture({ config: VARIANTE, playerIds: [KEVIN, JULIEN, SARAH] }), []),
        [Dart.double(8), Dart.triple(8)],
      ),
    ).toBe(true)
    expect(etat.finished).toBe(false)
    expect(KillerRules.currentPlayer(etat).playerId).toBe(JULIEN)
  })

  it('activée : s’il ne restait que lui et un adversaire, l’adversaire gagne', () => {
    const etat = jouer(ouverture({ config: VARIANTE }), [[Dart.double(8), Dart.triple(8)]])

    expect(etat.finished).toBe(true)
    expect(etat.winnerId).toBe(JULIEN)
    expect(etat.eliminations).toEqual([{ playerId: KEVIN, by: KEVIN }])
  })
})

describe('Killer — volée close (visitIsOver)', () => {
  const base = jouer(ouverture(), [])

  it('ouverte à 1 ou 2 fléchettes sans fin, close à 3', () => {
    expect(KillerRules.visitIsOver(base, [])).toBe(false)
    expect(KillerRules.visitIsOver(base, [Dart.miss()])).toBe(false)
    expect(KillerRules.visitIsOver(base, [Dart.miss(), Dart.miss()])).toBe(false)
    expect(KillerRules.visitIsOver(base, [Dart.miss(), Dart.miss(), Dart.miss()])).toBe(true)
  })

  it('close sur la fléchette qui gagne', () => {
    expect(KillerRules.visitIsOver(base, [Dart.double(8), Dart.triple(14)])).toBe(true)
  })
})

describe('Killer — 2, 3 et 6 joueurs, 3 et 5 vies', () => {
  it('à 6 joueurs et 5 vies, chacun a son numéro et ses vies', () => {
    const etat = jouer(
      ouverture({
        config: { startingLives: 5 },
        playerIds: [KEVIN, JULIEN, SARAH, PAUL, LEA, MARC],
      }),
      [],
    )

    expect(etat.players.map((p) => p.number)).toEqual([8, 14, 3, 11, 17, 20])
    expect(etat.players.every((p) => p.lives === 5 && !p.killer && !p.eliminated)).toBe(true)
  })

  it('à 6 joueurs, le tour saute deux éliminés d’affilée', () => {
    const SIX = ouverture({ playerIds: [KEVIN, JULIEN, SARAH, PAUL, LEA, MARC] })
    const etat = jouer(SIX, [[Dart.double(8), Dart.triple(14), Dart.triple(3)]])

    expect(KillerRules.currentPlayer(etat).playerId).toBe(PAUL)
    expect(KillerRules.aliveCount(etat)).toBe(4)
  })

  it('commence par le joueur désigné', () => {
    const etat = jouer(ouverture({ startingPlayerIndex: 1 }), [])
    expect(KillerRules.currentPlayer(etat).playerId).toBe(JULIEN)
  })
})

describe('Killer — validations de l’ouverture', () => {
  const refuse = (event: Parameters<typeof KillerRules.start>[0]) =>
    expect(() => KillerRules.start(event)).toThrow(DomainError)

  it('refuse 1 joueur et 7 joueurs, accepte 2 et 6', () => {
    refuse(ouverture({ playerIds: [KEVIN], numbers: [8] }))
    const sept = [KEVIN, JULIEN, SARAH, PAUL, LEA, MARC, PlayerId.of('zoe')]
    refuse(ouverture({ playerIds: sept, numbers: [1, 2, 3, 4, 5, 6, 7] }))
    expect(() => KillerRules.start(ouverture())).not.toThrow()
    expect(() =>
      KillerRules.start(ouverture({ playerIds: [KEVIN, JULIEN, SARAH, PAUL, LEA, MARC] })),
    ).not.toThrow()
  })

  it('refuse un joueur en double', () => {
    refuse(ouverture({ playerIds: [KEVIN, KEVIN], numbers: [8, 14] }))
  })

  it('refuse des longueurs différentes', () => {
    refuse(ouverture({ numbers: [8] }))
    refuse(ouverture({ numbers: [8, 14, 3] }))
  })

  it('refuse un numéro en double, hors 1-20, non entier ou la bulle', () => {
    refuse(ouverture({ numbers: [8, 8] }))
    for (const numero of [0, 21, 2.5, 'BULL', '8']) {
      refuse({ ...ouverture(), numbers: [8, numero] as never })
    }
  })

  it('refuse un startingPlayerIndex hors bornes', () => {
    refuse(ouverture({ startingPlayerIndex: 2 }))
    refuse(ouverture({ startingPlayerIndex: -1 }))
  })

  it('refuse une configuration invalide arrivée telle quelle', () => {
    refuse({ ...ouverture(), config: { startingLives: 4, selfHitCostsLives: false } as never })
    refuse({ ...ouverture(), config: { startingLives: 3, selfHitCostsLives: 'non' } as never })
  })

  it('refuse un journal qui ne s’ouvre pas sur KillerStarted ou mêle un RoundStarted', () => {
    expect(() => KillerRules.project([])).toThrow(DomainError)
    expect(() => KillerRules.project([ouverture(), { type: 'RoundStarted', target: 40 }])).toThrow(
      DomainError,
    )
  })

  it('refuse une volée vide ou de 4 fléchettes', () => {
    const etat = jouer(ouverture(), [])
    expect(() => KillerRules.applyVisit(etat, [])).toThrow(DomainError)
    expect(() => KillerRules.applyVisit(etat, Array(4).fill(Dart.miss()))).toThrow(DomainError)
  })
})

describe('Killer — annulation = projection du journal privé de sa dernière volée', () => {
  it('restitue vies, statut killer, élimination et joueur courant, à travers la victoire', () => {
    const volees = [
      [Dart.double(8), Dart.triple(14)],
      [Dart.single(14), Dart.miss(), Dart.miss()],
      [Dart.triple(3)],
    ]
    const events = journal(A_TROIS, volees)

    const fini = KillerRules.project(events)
    expect(fini.finished).toBe(true)

    const avantVictoire = KillerRules.project(events.slice(0, -1))
    expect(avantVictoire.finished).toBe(false)
    expect(avantVictoire.winnerId).toBeNull()
    expect(joueur(avantVictoire, SARAH)).toMatchObject({ lives: 3, eliminated: false })
    expect(KillerRules.currentPlayer(avantVictoire).playerId).toBe(KEVIN)

    const avantElimination = KillerRules.project(events.slice(0, 1))
    expect(joueur(avantElimination, JULIEN)).toMatchObject({ lives: 3, eliminated: false })
    expect(joueur(avantElimination, KEVIN).killer).toBe(false)
    expect(avantElimination.eliminations).toEqual([])
    expect(KillerRules.currentPlayer(avantElimination).playerId).toBe(KEVIN)
  })

  it('deux éliminations dans la même volée, puis annulation : volée entière, puis fléchette', () => {
    const SIX = ouverture({ playerIds: [KEVIN, JULIEN, SARAH, PAUL, LEA, MARC] })
    const events = journal(SIX, [[Dart.double(8), Dart.triple(14), Dart.triple(3)]])
    // Précondition : les deux éliminations ont bien eu lieu.
    const apres = KillerRules.project(events)
    expect(apres.eliminations).toEqual([
      { playerId: JULIEN, by: KEVIN },
      { playerId: SARAH, by: KEVIN },
    ])

    const annulee = KillerRules.project(events.slice(0, -1))
    expect(annulee.eliminations).toEqual([])
    expect(annulee.players.every((p) => p.lives === 3 && !p.eliminated && !p.killer)).toBe(true)
    expect(KillerRules.currentPlayer(annulee).playerId).toBe(KEVIN)

    // Volée rouverte sans sa dernière fléchette : Sarah revit, Julien reste éliminé.
    const rouverte = KillerRules.applyVisit(annulee, [Dart.double(8), Dart.triple(14)])
    expect(rouverte.eliminations).toEqual([{ playerId: JULIEN, by: KEVIN }])
    expect(joueur(rouverte, SARAH)).toMatchObject({ lives: 3, eliminated: false })
  })

  it('départ à Sarah (startingPlayerIndex 2) et élimination : le tour saute l’éliminé, l’annulation rend la main à Sarah', () => {
    const depart = ouverture({ playerIds: [KEVIN, JULIEN, SARAH], startingPlayerIndex: 2 })
    const events = journal(depart, [[Dart.double(3), Dart.triple(8)], [Dart.miss()]])

    const etat = KillerRules.project(events)
    expect(joueur(etat, KEVIN).eliminated).toBe(true)
    expect(etat.eliminations).toEqual([{ playerId: KEVIN, by: SARAH }])
    // Julien a joué après Sarah ; Kevin (index 0) est sauté : retour à Sarah.
    expect(KillerRules.currentPlayer(etat).playerId).toBe(SARAH)
    // Annuler la volée de Julien : c'est à lui, Kevin toujours éliminé.
    const sansJulien = KillerRules.project(events.slice(0, -1))
    expect(KillerRules.currentPlayer(sansJulien).playerId).toBe(JULIEN)
    expect(joueur(sansJulien, KEVIN).eliminated).toBe(true)

    // Annuler aussi celle de Sarah : la main revient à la joueuse désignée.
    const annulee = KillerRules.project(events.slice(0, 1))
    expect(annulee.startingPlayerIndex).toBe(2)
    expect(KillerRules.currentPlayer(annulee).playerId).toBe(SARAH)
    expect(joueur(annulee, KEVIN).eliminated).toBe(false)
  })

  it('l’annulation de la fléchette éliminante (volée rouverte) rend le joueur au tour de table', () => {
    const base = KillerRules.project([A_TROIS])
    const rouverte = KillerRules.applyVisit(base, [Dart.double(8)])

    expect(joueur(rouverte, JULIEN).eliminated).toBe(false)
    expect(rouverte.eliminations).toEqual([])
    expect(KillerRules.currentPlayer(rouverte).playerId).toBe(JULIEN)
  })
})

describe('Killer — propriété de préfixe : l’aperçu égale le rejeu', () => {
  const CANDIDATES = [
    Dart.double(8),
    Dart.single(8),
    Dart.triple(8),
    Dart.single(14),
    Dart.triple(14),
    Dart.double(3),
    Dart.triple(3),
    Dart.miss(),
    Dart.bullseye(),
  ]

  const departs: readonly [string, KillerState][] = [
    ['au départ', KillerRules.project([A_TROIS])],
    [
      'variante, Kevin déjà killer',
      KillerRules.project(
        journal(
          ouverture({ config: { selfHitCostsLives: true }, playerIds: [KEVIN, JULIEN, SARAH] }),
          [[Dart.double(8)], [Dart.miss()], [Dart.miss()]],
        ),
      ),
    ],
  ]

  it.each(departs)(
    '%s : l’effet de la fléchette k ne dépend que des fléchettes 1 à k',
    (_, depart) => {
      let verifiees = 0
      for (const a of CANDIDATES) {
        for (const b of CANDIDATES) {
          for (const c of CANDIDATES) {
            const complete = KillerRules.applyVisit(depart, [a, b, c])
            const visite = derniereVolee(complete)

            for (let k = 1; k <= visite.darts.length; k += 1) {
              const partielle = KillerRules.applyVisit(depart, [a, b, c].slice(0, k))
              expect(derniereVolee(partielle).effects).toEqual(visite.effects.slice(0, k))
              if (k === visite.darts.length) {
                expect(partielle.players).toEqual(complete.players)
                expect(partielle.eliminations).toEqual(complete.eliminations)
                expect(partielle.winnerId).toEqual(complete.winnerId)
              }
              verifiees += 1
            }
          }
        }
      }
      // Plancher : la boucle a bien tourné.
      expect(verifiees).toBeGreaterThan(CANDIDATES.length ** 3)
    },
  )
})

describe('Killer — la couture GameMode', () => {
  it('modeOf lit KillerStarted, et GameModes aiguille vers les règles du Killer', () => {
    const events = journal(ouverture(), [[Dart.double(8)]])

    expect(modeOf(events)).toBe('KILLER')
    const etat = GameModes.project(events)
    expect(etat.mode).toBe('KILLER')
    expect(GameModes.isFinished(etat)).toBe(false)
    expect(GameModes.currentPlayerId(etat)).toBe(JULIEN)
    expect(GameModes.visitCount(etat)).toBe(1)
    expect(GameModes.isSolo('KILLER')).toBe(false)
  })
})
