import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import type { MatchEvent } from '@/core/domain/events/MatchEvent'
import { GameModes } from '@/core/domain/games'
import { CRICKET_TARGETS, CricketConfig } from '@/core/domain/games/cricket/config'
import { CricketRules, type CricketState } from '@/core/domain/games/cricket/rules'
import { Dart, type Segment } from '@/core/domain/value-objects/Dart'
import { PlayerId } from '@/core/domain/value-objects/ids'

const KEVIN = PlayerId.of('kevin')
const JULIEN = PlayerId.of('julien')
const PAUL = PlayerId.of('paul')

/** Trois cibles au lieu de sept : les scénarios tiennent en quelques volées. */
const COURT = CricketConfig.create({ targets: [20, 19, 'BULL'] })
const COURT_CUT = CricketConfig.create({ targets: [20, 19, 'BULL'], variant: 'CUT_THROAT' })

const journal = (
  config: CricketConfig,
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  startingPlayerIndex = 0,
): readonly MatchEvent[] => [
  { type: 'CricketStarted', config, playerIds, startingPlayerIndex },
  ...volees.map((darts): MatchEvent => ({ type: 'VisitRecorded', darts })),
]

const jouer = (
  playerIds: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
  config: CricketConfig = COURT,
): CricketState => CricketRules.project(journal(config, playerIds, volees))

const joueur = (state: CricketState, playerId: PlayerId) => {
  const found = state.players.find((p) => p.playerId === playerId)
  if (!found) throw new Error(`Joueur introuvable : ${playerId}`)
  return found
}

const RATE = [Dart.miss(), Dart.miss(), Dart.miss()]

describe('Cricket — fermer les cibles', () => {
  it('démarre tout le monde à zéro marque et zéro point', () => {
    const state = jouer([KEVIN, JULIEN], [])

    expect(state.mode).toBe('CRICKET')
    expect(joueur(state, KEVIN).marks).toEqual([0, 0, 0])
    expect(joueur(state, KEVIN).score).toBe(0)
    expect(state.finished).toBe(false)
  })

  it('pose autant de marques que le multiplicateur', () => {
    expect(joueur(jouer([KEVIN], [[Dart.single(20)]]), KEVIN).marks[0]).toBe(1)
    expect(joueur(jouer([KEVIN], [[Dart.double(20)]]), KEVIN).marks[0]).toBe(2)
    expect(joueur(jouer([KEVIN], [[Dart.triple(20)]]), KEVIN).marks[0]).toBe(3)
  })

  it('compte l’anneau à 25 pour une marque et le centre à 50 pour deux', () => {
    expect(joueur(jouer([KEVIN], [[Dart.bull()]]), KEVIN).marks[2]).toBe(1)
    expect(joueur(jouer([KEVIN], [[Dart.bullseye()]]), KEVIN).marks[2]).toBe(2)
  })

  it('ignore une fléchette hors des sept cibles, sans la perdre pour autant', () => {
    const state = jouer([KEVIN], [[Dart.triple(12), Dart.miss(), Dart.single(20)]])

    expect(joueur(state, KEVIN).marks).toEqual([1, 0, 0])
    // Les fléchettes sont bel et bien lancées : elles comptent dans le total.
    expect(joueur(state, KEVIN).dartsThrown).toBe(3)
  })

  it('note la fermeture d’une cible dans les jalons', () => {
    const state = jouer([KEVIN, JULIEN], [[Dart.triple(20)]])

    expect(state.milestones).toEqual([{ type: 'TargetClosed', playerId: KEVIN, target: 20 }])
    expect(state.history[0]?.marks).toBe(3)
  })
})

describe('Cricket — marquer des points', () => {
  it('ne rapporte rien tant que la cible n’est pas fermée', () => {
    const state = jouer([KEVIN, JULIEN], [[Dart.double(20)]])

    expect(joueur(state, KEVIN).score).toBe(0)
  })

  /** Le cœur du comptage : un triple peut fermer ET marquer avec ce qui dépasse. */
  it('convertit en points les marques qui dépassent la fermeture', () => {
    const state = jouer([KEVIN, JULIEN], [[Dart.double(20), Dart.triple(20)]])

    // 2 marques puis 3 : la première ferme, les deux autres valent 20 chacune.
    expect(joueur(state, KEVIN).marks[0]).toBe(3)
    expect(joueur(state, KEVIN).score).toBe(40)
    expect(state.history[0]?.points).toBe(40)
  })

  it('vaut 25 par marque sur la bulle', () => {
    const state = jouer([KEVIN, JULIEN], [[Dart.bullseye(), Dart.bullseye()]])

    // 2 marques, puis 1 qui ferme et 1 qui rapporte.
    expect(joueur(state, KEVIN).marks[2]).toBe(3)
    expect(joueur(state, KEVIN).score).toBe(25)
  })

  /**
   * La règle qui donne son sel au jeu : une cible fermée par **tout le monde**
   * est morte, elle ne rapporte plus rien — d'où la course à fermer avant
   * l'autre plutôt qu'à empiler les points.
   */
  it('ne rapporte plus rien sur une cible fermée par tous', () => {
    const state = jouer(
      [KEVIN, JULIEN],
      [[Dart.triple(20)], [Dart.triple(20)], [Dart.triple(20), Dart.triple(20)]],
    )

    expect(CricketRules.isDead(state, 0)).toBe(true)
    expect(joueur(state, KEVIN).score).toBe(0)
  })

  it('rapporte encore tant qu’un seul adversaire n’a pas fermé', () => {
    const state = jouer(
      [KEVIN, JULIEN, PAUL],
      [[Dart.triple(20)], [Dart.triple(20)], RATE, [Dart.triple(20)]],
    )

    // Paul n'a pas fermé le 20 : la cible vit encore, Kevin marque ses 60.
    expect(CricketRules.isDead(state, 0)).toBe(false)
    expect(joueur(state, KEVIN).score).toBe(60)
  })

  it('ne marque aucun point en solo : il n’y a personne à qui prendre l’avantage', () => {
    const state = jouer([KEVIN], [[Dart.triple(20), Dart.triple(20)]])

    expect(joueur(state, KEVIN).score).toBe(0)
  })
})

describe('Cricket — cut-throat', () => {
  /**
   * Le renversement : les points ne sont pas gagnés, ils sont **infligés**. Ils
   * vont à chaque adversaire qui n'a pas fermé la cible, et le plus petit score
   * gagne. Marquer devient un choix de victime.
   */
  it('donne les points aux adversaires plutôt qu’au lanceur', () => {
    const state = jouer([KEVIN, JULIEN, PAUL], [[Dart.triple(20), Dart.triple(20)]], COURT_CUT)

    expect(joueur(state, KEVIN).score).toBe(0)
    expect(joueur(state, JULIEN).score).toBe(60)
    expect(joueur(state, PAUL).score).toBe(60)
    // La volée « vaut » 60 : c'est ce montant qui part chez chaque victime.
    expect(state.history[0]?.points).toBe(60)
  })

  it('épargne l’adversaire qui a déjà fermé la cible', () => {
    const state = jouer(
      [KEVIN, JULIEN, PAUL],
      [[Dart.triple(20)], [Dart.triple(20)], RATE, [Dart.triple(20)]],
      COURT_CUT,
    )

    // Julien a fermé le 20, il ne prend rien ; Paul encaisse.
    expect(joueur(state, JULIEN).score).toBe(0)
    expect(joueur(state, PAUL).score).toBe(60)
  })
})

describe('Cricket — victoire', () => {
  const FERME_20 = [Dart.triple(20)]
  const FERME_19 = [Dart.triple(19)]
  const FERME_BULL = [Dart.bullseye(), Dart.bull()]

  it('se gagne en fermant tout, à condition de ne pas être derrière', () => {
    const state = jouer([KEVIN, JULIEN], [FERME_20, RATE, FERME_19, RATE, FERME_BULL])

    expect(state.finished).toBe(true)
    expect(state.winnerId).toBe(KEVIN)
    expect(state.milestones.at(-1)).toEqual({ type: 'MatchFinished', winnerId: KEVIN })
  })

  it('suffit à égalité de points : il n’y a pas d’écart à creuser', () => {
    const state = jouer([KEVIN, JULIEN], [FERME_20, RATE, FERME_19, RATE, FERME_BULL])

    expect(joueur(state, KEVIN).score).toBe(joueur(state, JULIEN).score)
    expect(state.winnerId).toBe(KEVIN)
  })

  /**
   * Le cas que les compteurs amateurs ratent : tout fermer ne suffit pas. Tant
   * qu'on est derrière au score, la partie continue — il faut aller chercher
   * les points sur les cibles que l'adversaire n'a pas encore fermées.
   */
  it('ne se gagne pas en fermant tout si l’on est derrière au score', () => {
    const state = jouer(
      [KEVIN, JULIEN],
      [
        // Julien prend 57 d'avance sur le 19, que Kevin n'a pas encore fermé.
        [Dart.triple(20)],
        [Dart.triple(19), Dart.triple(19)],
        [Dart.triple(19)],
        RATE,
        FERME_BULL,
      ],
    )

    expect(CricketRules.closedAll(joueur(state, KEVIN))).toBe(true)
    expect(joueur(state, KEVIN).score).toBeLessThan(joueur(state, JULIEN).score)
    expect(state.finished).toBe(false)
    expect(state.winnerId).toBeNull()
  })

  it('se gagne au plus PETIT score en cut-throat', () => {
    const state = jouer(
      [KEVIN, JULIEN],
      [FERME_20, [Dart.triple(19), Dart.triple(19)], FERME_19, RATE, FERME_BULL],
      COURT_CUT,
    )

    // Julien a collé 57 à Kevin : Kevin ferme tout mais mène au score, donc perd
    // le droit de conclure.
    expect(joueur(state, KEVIN).score).toBe(57)
    expect(joueur(state, JULIEN).score).toBe(0)
    expect(state.finished).toBe(false)
  })

  it('arrête la volée sur la fléchette qui gagne', () => {
    const state = jouer(
      [KEVIN, JULIEN],
      [FERME_20, RATE, FERME_19, RATE, [Dart.bullseye(), Dart.bull(), Dart.triple(20)]],
    )

    expect(state.finished).toBe(true)
    expect(state.history.at(-1)?.darts).toHaveLength(2)
    expect(joueur(state, KEVIN).dartsThrown).toBe(4)
  })

  it('refuse une volée après la fin', () => {
    const fini = jouer([KEVIN, JULIEN], [FERME_20, RATE, FERME_19, RATE, FERME_BULL])

    expect(() => CricketRules.applyVisit(fini, RATE)).toThrow(DomainError)
  })

  /**
   * ⚠️ Le cas tordu du cut-throat, et la raison pour laquelle la victoire est
   * aussi vérifiée en fin de volée pour les autres : un joueur qui a tout fermé
   * ne reçoit plus jamais de points, tandis que ceux des autres montent. Il
   * peut donc devenir le plus bas **pendant le tour de quelqu'un d'autre**.
   */
  it('conclut même quand le vainqueur n’a pas lancé la dernière fléchette', () => {
    const avant = jouer(
      [KEVIN, JULIEN, PAUL],
      [
        // Kevin ferme le 20 et la bulle.
        [Dart.triple(20), Dart.bullseye(), Dart.bull()],
        // Julien ferme le 19 et colle 19 à Kevin comme à Paul.
        [Dart.triple(19), Dart.single(19)],
        RATE,
        // Kevin ferme le 19 : tout est fermé, mais il mène au score (19 contre 0).
        [Dart.triple(19)],
      ],
      COURT_CUT,
    )

    expect(CricketRules.closedAll(joueur(avant, KEVIN))).toBe(true)
    expect(avant.finished).toBe(false)

    const apres = jouer(
      [KEVIN, JULIEN, PAUL],
      [
        [Dart.triple(20), Dart.bullseye(), Dart.bull()],
        [Dart.triple(19), Dart.single(19)],
        RATE,
        [Dart.triple(19)],
        // Julien envoie 20 à Paul (Kevin a fermé le 20, il est intouchable).
        [Dart.triple(20), Dart.single(20)],
        // Paul envoie 25 à Julien sur la bulle : les deux passent devant Kevin,
        // qui gagne sans avoir lancé.
        [Dart.bullseye(), Dart.bull(), Dart.bull()],
      ],
      COURT_CUT,
    )

    expect(apres.finished).toBe(true)
    expect(apres.winnerId).toBe(KEVIN)
    expect(apres.history.at(-1)?.playerId).toBe(PAUL)
  })
})

describe('Cricket — tours, annulation et configuration', () => {
  it('alterne les joueurs à chaque volée', () => {
    expect(jouer([KEVIN, JULIEN], []).currentPlayerIndex).toBe(0)
    expect(jouer([KEVIN, JULIEN], [RATE]).currentPlayerIndex).toBe(1)
    expect(jouer([KEVIN, JULIEN], [RATE, RATE]).currentPlayerIndex).toBe(0)
  })

  it('respecte le joueur qui commence', () => {
    expect(CricketRules.project(journal(COURT, [KEVIN, JULIEN], [], 1)).currentPlayerIndex).toBe(1)
  })

  it('annule une volée en rejouant le journal amputé', () => {
    const complet = journal(COURT, [KEVIN, JULIEN], [[Dart.triple(20)], RATE, [Dart.triple(20)]])

    const avant = CricketRules.project(complet.slice(0, -1))
    expect(joueur(avant, KEVIN).score).toBe(0)

    const apres = CricketRules.project(complet)
    expect(joueur(apres, KEVIN).score).toBe(60)
  })

  it('refuse un journal qui ne commence pas par son événement d’ouverture', () => {
    expect(() => CricketRules.project([])).toThrow(DomainError)
    expect(() => CricketRules.project([{ type: 'VisitRecorded', darts: [Dart.miss()] }])).toThrow(
      DomainError,
    )
  })

  it('propose sept cibles par défaut : 20 à 15, puis la bulle', () => {
    expect(CRICKET_TARGETS).toEqual([20, 19, 18, 17, 16, 15, 'BULL'])
    expect(CricketConfig.create().variant).toBe('STANDARD')
  })

  it('refuse une configuration incohérente', () => {
    expect(() => CricketConfig.create({ targets: [] as readonly Segment[] })).toThrow(DomainError)
    expect(() => CricketConfig.create({ targets: [20, 20] })).toThrow(DomainError)
    expect(() => CricketConfig.create({ targets: [20, 'MISS'] })).toThrow(DomainError)
    expect(() => CricketConfig.create({ variant: 'INCONNUE' as unknown as 'STANDARD' })).toThrow(
      DomainError,
    )
  })
})

describe('Couture GameMode — le quatrième mode', () => {
  it('reconnaît le Cricket sur le premier événement du journal', () => {
    expect(GameModes.modeOf(journal(COURT, [KEVIN], []))).toBe('CRICKET')
  })

  it('aiguille projection, fin de partie et joueur courant', () => {
    const state = GameModes.project(journal(COURT, [KEVIN, JULIEN], [RATE]))

    expect(state.mode).toBe('CRICKET')
    expect(GameModes.isFinished(state)).toBe(false)
    expect(GameModes.currentPlayerId(state)).toBe(JULIEN)
    expect(GameModes.visitCount(state)).toBe(1)
    expect(GameModes.isSolo('CRICKET')).toBe(false)
  })
})
