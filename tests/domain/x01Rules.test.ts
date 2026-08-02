import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/domain/DomainError'
import { X01Config } from '@/core/domain/entities/Match'
import { X01Rules } from '@/core/domain/services/x01Rules'
import { Dart } from '@/core/domain/value-objects/Dart'
import { courant, derniereVolee, JULIEN, jouer, joueur, journal, KEVIN } from './helpers'

const T20 = Dart.triple(20)
const S20 = Dart.single(20)
const D20 = Dart.double(20)
const DEUX_JOUEURS = [KEVIN, JULIEN] as const

describe('X01Config', () => {
  it('applique les défauts décidés : 501, best-of 3 legs, double out', () => {
    const config = X01Config.create()
    expect(config.startingScore).toBe(501)
    expect(config.legsToWin).toBe(2)
    expect(config.setsToWin).toBe(1)
    expect(config.doubleOut).toBe(true)
    expect(config.doubleIn).toBe(false)
  })

  it('convertit un best-of en « premier à N »', () => {
    expect(X01Config.legsForBestOf(3)).toBe(2)
    expect(X01Config.legsForBestOf(5)).toBe(3)
    expect(X01Config.legsForBestOf(1)).toBe(1)
  })

  it('refuse une configuration absurde', () => {
    expect(() => X01Config.create({ startingScore: 1 })).toThrow(DomainError)
    expect(() => X01Config.create({ legsToWin: 0 })).toThrow(DomainError)
  })
})

describe('X01Rules — décompte', () => {
  it('décompte une volée normale', () => {
    const state = jouer(X01Config.create(), DEUX_JOUEURS, [[T20, T20, T20]])

    expect(joueur(state, KEVIN).remaining).toBe(321)
    expect(derniereVolee(state).outcome).toBe('SCORED')
    expect(derniereVolee(state).scored).toBe(180)
  })
})

describe('X01Rules — bust', () => {
  it('bust quand le reste passe sous zéro', () => {
    const state = jouer(X01Config.create({ startingScore: 20 }), DEUX_JOUEURS, [[T20]])

    expect(derniereVolee(state).outcome).toBe('BUSTED')
    expect(joueur(state, KEVIN).remaining).toBe(20)
  })

  it('bust quand le reste tombe à 1, infinissable sur un double', () => {
    const state = jouer(X01Config.create({ startingScore: 21 }), DEUX_JOUEURS, [[S20]])

    expect(derniereVolee(state).outcome).toBe('BUSTED')
    expect(joueur(state, KEVIN).remaining).toBe(21)
  })

  it('bust quand le reste tombe à 0 sans double', () => {
    const state = jouer(X01Config.create({ startingScore: 20 }), DEUX_JOUEURS, [[S20]])

    expect(derniereVolee(state).outcome).toBe('BUSTED')
    expect(joueur(state, KEVIN).remaining).toBe(20)
  })

  it('ne sort pas sur le bull simple : 25 n’est pas un double', () => {
    const state = jouer(X01Config.create({ startingScore: 25 }), DEUX_JOUEURS, [[Dart.bull()]])

    expect(derniereVolee(state).outcome).toBe('BUSTED')
  })

  it('annule la volée ENTIÈRE : le score revient exactement à sa valeur d’avant', () => {
    const state = jouer(X01Config.create({ startingScore: 100 }), DEUX_JOUEURS, [[T20, T20]])
    const volee = derniereVolee(state)

    expect(volee.outcome).toBe('BUSTED')
    expect(volee.scored).toBe(0)
    expect(volee.remainingBefore).toBe(100)
    expect(volee.remainingAfter).toBe(100)
    // La 3e fléchette n'a pas été lancée : la volée s'arrête au bust.
    expect(volee.darts).toHaveLength(2)
  })

  it('compte quand même les fléchettes lancées lors d’un bust', () => {
    const state = jouer(X01Config.create({ startingScore: 100 }), DEUX_JOUEURS, [[T20, T20]])

    expect(joueur(state, KEVIN).dartsThrownInLeg).toBe(2)
  })
})

describe('X01Rules — sortie', () => {
  it('sort sur un double', () => {
    const state = jouer(X01Config.create({ startingScore: 40 }), DEUX_JOUEURS, [[D20]])

    expect(derniereVolee(state).outcome).toBe('CHECKOUT')
    expect(joueur(state, KEVIN).remaining).toBe(40) // leg suivant : score réinitialisé
    expect(derniereVolee(state).remainingAfter).toBe(0)
  })

  it('sort sur le bullseye, qui compte comme un double', () => {
    const state = jouer(X01Config.create({ startingScore: 50 }), DEUX_JOUEURS, [[Dart.bullseye()]])

    expect(derniereVolee(state).outcome).toBe('CHECKOUT')
  })

  it('sort sur n’importe quelle fléchette si le double out est désactivé', () => {
    const config = X01Config.create({ startingScore: 20, doubleOut: false })
    const state = jouer(config, DEUX_JOUEURS, [[S20]])

    expect(derniereVolee(state).outcome).toBe('CHECKOUT')
  })

  it('autorise un reste de 1 quand le double out est désactivé', () => {
    const config = X01Config.create({ startingScore: 21, doubleOut: false })
    const state = jouer(config, DEUX_JOUEURS, [[S20]])

    expect(derniereVolee(state).outcome).toBe('SCORED')
    expect(joueur(state, KEVIN).remaining).toBe(1)
  })
})

describe('X01Rules — double in', () => {
  const config = (input = {}) => X01Config.create({ startingScore: 100, doubleIn: true, ...input })

  it('ne décompte rien tant qu’aucun double n’a été touché', () => {
    const state = jouer(config(), DEUX_JOUEURS, [[S20, S20, S20]])

    expect(joueur(state, KEVIN).remaining).toBe(100)
    expect(joueur(state, KEVIN).hasOpened).toBe(false)
    expect(derniereVolee(state).scored).toBe(0)
    expect(derniereVolee(state).outcome).toBe('SCORED')
  })

  it('ouvre sur un double, qui compte aussi comme des points', () => {
    const state = jouer(config(), DEUX_JOUEURS, [[D20, S20, S20]])

    expect(joueur(state, KEVIN).hasOpened).toBe(true)
    expect(joueur(state, KEVIN).remaining).toBe(20)
  })

  it('annule l’ouverture si la volée bust : la visite n’a pas eu lieu', () => {
    const state = jouer(config(), DEUX_JOUEURS, [[D20, T20]])

    expect(derniereVolee(state).outcome).toBe('BUSTED')
    expect(joueur(state, KEVIN).remaining).toBe(100)
    expect(joueur(state, KEVIN).hasOpened).toBe(false)
  })
})

describe('X01Rules — tours, legs et sets', () => {
  it('passe la main après une volée', () => {
    const state = jouer(X01Config.create(), DEUX_JOUEURS, [[T20]])

    expect(courant(state).playerId).toBe(JULIEN)
  })

  it('signale le leg gagné avec le nombre de fléchettes utilisées', () => {
    const config = X01Config.create({ startingScore: 100, legsToWin: 2 })
    const state = jouer(config, DEUX_JOUEURS, [
      [T20], // Kevin : 100 → 40
      [T20], // Julien : 100 → 40
      [D20], // Kevin sort
    ])

    expect(state.milestones).toEqual([
      { type: 'LegWon', playerId: KEVIN, legNumber: 0, dartsUsed: 2 },
    ])
    expect(joueur(state, KEVIN).legsWonInSet).toBe(1)
  })

  it('réinitialise les scores et fait tourner le départ au leg suivant', () => {
    const config = X01Config.create({ startingScore: 40, legsToWin: 2 })
    const state = jouer(config, DEUX_JOUEURS, [[D20]])

    expect(state.legNumber).toBe(1)
    expect(joueur(state, KEVIN).remaining).toBe(40)
    expect(joueur(state, JULIEN).remaining).toBe(40)
    expect(courant(state).playerId).toBe(JULIEN)
  })

  it('termine un best-of 3 dès qu’un joueur gagne 2 legs', () => {
    const config = X01Config.create({ startingScore: 40, legsToWin: 2 })
    const state = jouer(config, DEUX_JOUEURS, [
      [D20], // leg 0 : Kevin
      [D20], // leg 1 : Julien (c'est son tour de commencer)
      [D20], // leg 2 : Kevin
    ])

    expect(state.winnerId).toBe(KEVIN)
    expect(X01Rules.isFinished(state)).toBe(true)
    expect(state.milestones.map((m) => m.type)).toEqual([
      'LegWon',
      'LegWon',
      'LegWon',
      'SetWon',
      'MatchFinished',
    ])
  })

  it('enchaîne les sets quand le match se joue en plusieurs sets', () => {
    const config = X01Config.create({ startingScore: 40, legsToWin: 1, setsToWin: 2 })
    const state = jouer(config, DEUX_JOUEURS, [
      [D20], // set 0 : Kevin
      [D20], // set 1 : Julien
      [D20], // set 2 : Kevin → match
    ])

    expect(state.winnerId).toBe(KEVIN)
    expect(joueur(state, KEVIN).setsWon).toBe(2)
    expect(joueur(state, JULIEN).setsWon).toBe(1)
  })
})

describe('X01Rules — annulation', () => {
  it('restaure exactement l’état précédent', () => {
    const config = X01Config.create()
    const complet = journal(config, DEUX_JOUEURS, [
      [T20, T20, T20],
      [T20, T20, T20],
    ])

    // L'état observé AVANT d'enregistrer la 2e volée, construit indépendamment.
    const avant = X01Rules.project(journal(config, DEUX_JOUEURS, [[T20, T20, T20]]))
    const annule = X01Rules.project(complet.slice(0, -1))

    expect(X01Rules.project(complet)).not.toEqual(avant)
    expect(annule).toEqual(avant)
    expect(joueur(annule, JULIEN).remaining).toBe(501)
    expect(courant(annule).playerId).toBe(JULIEN)
  })

  it('annule aussi une volée qui avait gagné un leg', () => {
    const config = X01Config.create({ startingScore: 40, legsToWin: 2 })
    const complet = journal(config, DEUX_JOUEURS, [[D20]])
    const annule = X01Rules.project(complet.slice(0, -1))

    expect(annule.legNumber).toBe(0)
    expect(annule.milestones).toEqual([])
    expect(joueur(annule, KEVIN).legsWonInSet).toBe(0)
    expect(joueur(annule, KEVIN).remaining).toBe(40)
    expect(courant(annule).playerId).toBe(KEVIN)
  })
})

describe('X01Rules — garde-fous', () => {
  const config = X01Config.create()

  it('refuse une volée vide ou de plus de 3 fléchettes', () => {
    const state = X01Rules.project(journal(config, DEUX_JOUEURS, []))

    expect(() => X01Rules.applyVisit(state, [])).toThrow(DomainError)
    expect(() => X01Rules.applyVisit(state, [T20, T20, T20, T20])).toThrow(DomainError)
  })

  it('refuse de jouer une fois le match terminé', () => {
    const fini = jouer(X01Config.create({ startingScore: 40, legsToWin: 1 }), DEUX_JOUEURS, [[D20]])

    expect(X01Rules.isFinished(fini)).toBe(true)
    expect(() => X01Rules.applyVisit(fini, [T20])).toThrow(DomainError)
  })

  it('refuse un journal qui ne commence pas par MatchStarted', () => {
    expect(() => X01Rules.project([{ type: 'VisitRecorded', darts: [T20] }])).toThrow(DomainError)
    expect(() => X01Rules.project([])).toThrow(DomainError)
  })

  it('refuse deux MatchStarted dans le même journal', () => {
    const debut = journal(config, DEUX_JOUEURS, [])
    expect(() => X01Rules.project([...debut, ...debut])).toThrow(DomainError)
  })

  it('refuse un joueur présent deux fois', () => {
    expect(() => X01Rules.project(journal(config, [KEVIN, KEVIN], []))).toThrow(DomainError)
  })

  it('refuse un index de départ hors bornes', () => {
    expect(() => X01Rules.project(journal(config, DEUX_JOUEURS, [], 2))).toThrow(DomainError)
  })
})
