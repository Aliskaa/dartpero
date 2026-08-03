import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import { GameModes } from '@/core/domain/games'
import { TOUR_DU_MONDE_TARGETS, TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { TourDuMondeRules, type TourDuMondeState } from '@/core/domain/games/tour-du-monde/rules'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart, type Segment } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'

const KEVIN = PlayerId.of('kevin')
const JULIEN = PlayerId.of('julien')
const PAUL = PlayerId.of('paul')

/** Un parcours court, pour écrire des tests lisibles : 20, 19, puis la bulle. */
const COURT = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })

const journal = (
  config: TourDuMondeConfig,
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  startingPlayerIndex = 0,
): readonly MatchEvent[] => [
  { type: 'TourDuMondeStarted', config, playerIds, startingPlayerIndex },
  ...volees.map((darts): MatchEvent => ({ type: 'VisitRecorded', darts })),
]

const jouer = (
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  config: TourDuMondeConfig = COURT,
): TourDuMondeState => TourDuMondeRules.project(journal(config, playerIds, volees))

const joueur = (state: TourDuMondeState, playerId: PlayerId) => {
  const found = state.players.find((p) => p.playerId === playerId)
  if (!found) throw new Error(`Joueur introuvable : ${playerId}`)
  return found
}

/** Trois fléchettes qui ne touchent rien. */
const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Tour du monde — progression', () => {
  it('démarre tout le monde sur la première cible', () => {
    const state = jouer([KEVIN, JULIEN], [])

    expect(state.mode).toBe('TOUR_DU_MONDE')
    expect(joueur(state, KEVIN).targetIndex).toBe(0)
    expect(TourDuMondeRules.currentTarget(state, joueur(state, KEVIN))).toBe(20)
    expect(state.finished).toBe(false)
  })

  /** Le cœur du jeu : le multiplicateur ne compte pas, seul le secteur compte. */
  it('valide la cible quel que soit le multiplicateur', () => {
    for (const dart of [Dart.single(20), Dart.double(20), Dart.triple(20)]) {
      expect(joueur(jouer([KEVIN], [[dart]]), KEVIN).targetIndex).toBe(1)
    }
  })

  it('ne valide rien sur un secteur voisin ou une fléchette manquée', () => {
    expect(joueur(jouer([KEVIN], [[Dart.triple(19), Dart.miss()]]), KEVIN).targetIndex).toBe(0)
  })

  it('enchaîne plusieurs cibles dans la même volée', () => {
    const state = jouer([KEVIN], [[Dart.single(20), Dart.triple(19), Dart.bull()]])

    expect(joueur(state, KEVIN).targetIndex).toBe(3)
    expect(state.history[0]?.hits).toBe(3)
  })

  it('accepte l’anneau à 25 comme le centre à 50 pour la bulle', () => {
    const versLaBulle = [Dart.single(20), Dart.single(19)]

    for (const bulle of [Dart.bull(), Dart.bullseye()]) {
      const state = jouer([KEVIN], [[...versLaBulle, bulle]])
      expect(joueur(state, KEVIN).finishedInDarts).toBe(3)
    }
  })

  it('compte 21 cibles sur le parcours par défaut : 20 → 1, puis la bulle', () => {
    expect(TOUR_DU_MONDE_TARGETS).toHaveLength(21)
    expect(TOUR_DU_MONDE_TARGETS[0]).toBe(20)
    expect(TOUR_DU_MONDE_TARGETS[19]).toBe(1)
    expect(TOUR_DU_MONDE_TARGETS.at(-1)).toBe('BULL')
  })
})

describe('Tour du monde — fin de partie', () => {
  /**
   * La règle choisie : quand quelqu'un boucle, les autres finissent leur volée.
   * Sans ça, celui qui commence part avec une longueur d'avance imméritée.
   */
  it('laisse les autres finir le tour de table avant de conclure', () => {
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]

    // Kevin boucle sur sa première volée, mais Julien n'a pas encore joué.
    const apresKevin = jouer([KEVIN, JULIEN], [bouclage])
    expect(apresKevin.finished).toBe(false)
    expect(apresKevin.lastRound).toBe(true)
    expect(apresKevin.winnerId).toBeNull()

    const apresJulien = jouer([KEVIN, JULIEN], [bouclage, RATE])
    expect(apresJulien.finished).toBe(true)
    expect(apresJulien.winnerId).toBe(KEVIN)
  })

  it('attend les deux adversaires à trois joueurs', () => {
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]

    expect(jouer([KEVIN, JULIEN, PAUL], [bouclage]).finished).toBe(false)
    expect(jouer([KEVIN, JULIEN, PAUL], [bouclage, RATE]).finished).toBe(false)
    expect(jouer([KEVIN, JULIEN, PAUL], [bouclage, RATE, RATE]).finished).toBe(true)
  })

  it('départage deux joueurs arrivés dans le même tour de table', () => {
    // Kevin boucle à sa 4ᵉ fléchette, Julien à sa 5ᵉ dans le même tour de
    // table : c'est le nombre de fléchettes qui tranche, pas l'ordre d'arrivée.
    const state = jouer(
      [KEVIN, JULIEN],
      [
        [Dart.single(20), Dart.single(19), Dart.miss()],
        [Dart.single(20), Dart.miss(), Dart.miss()],
        [Dart.bull()],
        [Dart.single(19), Dart.bull()],
      ],
    )

    expect(state.finished).toBe(true)
    expect(joueur(state, KEVIN).finishedInDarts).toBe(4)
    expect(joueur(state, JULIEN).finishedInDarts).toBe(5)
    expect(state.winnerId).toBe(KEVIN)
  })

  it('déclare un match nul à égalité parfaite, plutôt que de favoriser le premier', () => {
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]
    const state = jouer([KEVIN, JULIEN], [bouclage, bouclage])

    expect(state.finished).toBe(true)
    expect(state.winnerId).toBeNull()
    expect(state.players.every((p) => p.finishedInDarts === 3)).toBe(true)
  })

  it('arrête la volée sur la fléchette qui boucle, et ne compte pas les suivantes', () => {
    const state = jouer([KEVIN], [[Dart.single(20), Dart.single(19), Dart.bull()]])

    expect(joueur(state, KEVIN).dartsThrown).toBe(3)

    // Bouclé en deux fléchettes : la troisième n'est pas lancée.
    const rapide = jouer(
      [KEVIN],
      [
        [Dart.single(20), Dart.single(19)],
        [Dart.bull(), Dart.triple(20), Dart.triple(20)],
      ],
    )
    expect(joueur(rapide, KEVIN).dartsThrown).toBe(3)
    expect(rapide.history[1]?.darts).toHaveLength(1)
  })

  it('refuse une volée après la fin', () => {
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]
    const fini = jouer([KEVIN], [bouclage])

    expect(fini.finished).toBe(true)
    expect(() => TourDuMondeRules.applyVisit(fini, RATE)).toThrow(DomainError)
  })

  it('note le bouclage et la fin dans les jalons', () => {
    const state = jouer([KEVIN, JULIEN], [[Dart.single(20), Dart.single(19), Dart.bull()], RATE])

    expect(state.milestones).toEqual([
      { type: 'TourCompleted', playerId: KEVIN, darts: 3 },
      { type: 'MatchFinished', winnerId: KEVIN },
    ])
  })
})

describe('Tour du monde — tours et annulation', () => {
  it('alterne les joueurs à chaque volée', () => {
    expect(jouer([KEVIN, JULIEN], []).currentPlayerIndex).toBe(0)
    expect(jouer([KEVIN, JULIEN], [RATE]).currentPlayerIndex).toBe(1)
    expect(jouer([KEVIN, JULIEN], [RATE, RATE]).currentPlayerIndex).toBe(0)
  })

  it('respecte le joueur qui commence', () => {
    const state = TourDuMondeRules.project(journal(COURT, [KEVIN, JULIEN], [], 1))
    expect(state.currentPlayerIndex).toBe(1)
  })

  /** L'annulation reste ce qu'elle est partout ailleurs : on retire un événement. */
  it('annule une volée en rejouant le journal amputé', () => {
    const volees = [[Dart.single(20)], [Dart.single(20)], [Dart.single(19)]]
    const complet = journal(COURT, [KEVIN, JULIEN], volees)

    const avant = TourDuMondeRules.project(complet.slice(0, -1))
    expect(joueur(avant, KEVIN).targetIndex).toBe(1)

    const apres = TourDuMondeRules.project(complet)
    expect(joueur(apres, KEVIN).targetIndex).toBe(2)
  })

  it('refuse un journal qui ne commence pas par son événement d’ouverture', () => {
    expect(() => TourDuMondeRules.project([])).toThrow(DomainError)
    expect(() =>
      TourDuMondeRules.project([{ type: 'VisitRecorded', darts: [Dart.miss()] }]),
    ).toThrow(DomainError)
  })

  it('refuse une configuration sans cible', () => {
    expect(() => TourDuMondeConfig.create({ targets: [] as readonly Segment[] })).toThrow(
      DomainError,
    )
  })
})

describe('Couture GameMode', () => {
  it('reconnaît le mode sur le premier événement du journal', () => {
    expect(GameModes.modeOf(journal(COURT, [KEVIN], []))).toBe('TOUR_DU_MONDE')
  })

  /**
   * La garantie de non-régression du lot 5 : les parties enregistrées avant
   * l'arrivée des modes n'ont pas de marqueur et doivent rester du X01.
   */
  it('rejoue en X01 un journal qui n’a jamais entendu parler des modes', () => {
    const ancien: readonly MatchEvent[] = [
      {
        type: 'MatchStarted',
        config: X01Config.create({ startingScore: 501, legsToWin: 1 }),
        playerIds: [KEVIN],
        startingPlayerIndex: 0,
      },
      { type: 'VisitRecorded', darts: [Dart.triple(20)] },
    ]

    const state = GameModes.project(ancien)
    expect(state.mode).toBe('X01')
    expect(GameModes.currentPlayerId(state)).toBe(KEVIN)
    expect(GameModes.visitCount(state)).toBe(1)
  })

  it('aiguille projection, fin de partie et joueur courant selon le mode', () => {
    const state = GameModes.project(journal(COURT, [KEVIN, JULIEN], [RATE]))

    expect(state.mode).toBe('TOUR_DU_MONDE')
    expect(GameModes.isFinished(state)).toBe(false)
    expect(GameModes.currentPlayerId(state)).toBe(JULIEN)
  })
})
