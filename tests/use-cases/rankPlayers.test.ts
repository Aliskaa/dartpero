import { describe, expect, it } from 'vitest'
import { leadingPlayers, rankPlayers } from '@/core/application/use-cases/rankPlayers'
import { resumeCricket, resumeEntrainement, resumeTourDuMonde, resumeX01 } from '../fakes/resumes'

const noms = (joueurs: readonly { readonly name: string | null }[]) =>
  joueurs.map((joueur) => joueur.name)

describe('rankPlayers — X01 : le vainqueur, puis les sets, les manches, le plus petit reste', () => {
  it('le vainqueur passe devant, puis les autres par reste croissant', () => {
    const partie = resumeX01(
      [
        { nom: 'Sarah', remaining: 140 },
        { nom: 'Julien', remaining: 87 },
        { nom: 'Kevin', remaining: 0 },
      ],
      { gagnant: 'Kevin' },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Kevin', 'Julien', 'Sarah'])
  })

  it('le vainqueur déclaré passe devant même si un autre a un plus petit reste', () => {
    const partie = resumeX01(
      [
        { nom: 'Julien', remaining: 0 },
        { nom: 'Kevin', remaining: 12 },
      ],
      { gagnant: 'Kevin' },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Kevin', 'Julien'])
  })

  it('sans vainqueur : le plus de sets d’abord, même avec un reste plus gros', () => {
    const partie = resumeX01(
      [
        { nom: 'Kevin', remaining: 40, setsWon: 0, legsWonInSet: 2 },
        { nom: 'Sarah', remaining: 400, setsWon: 1, legsWonInSet: 0 },
      ],
      { config: { setsToWin: 2 } },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Sarah', 'Kevin'])
  })

  it('à sets égaux : le plus de manches, puis le plus petit reste', () => {
    const partie = resumeX01([
      { nom: 'Kevin', remaining: 100, legsWonInSet: 1 },
      { nom: 'Sarah', remaining: 300, legsWonInSet: 1 },
      { nom: 'Julien', remaining: 500, legsWonInSet: 2 },
      { nom: 'Lucie', remaining: 50, legsWonInSet: 1 },
    ])
    expect(noms(rankPlayers(partie))).toEqual(['Julien', 'Lucie', 'Kevin', 'Sarah'])
  })
})

describe('rankPlayers — Cricket : le vainqueur, le score, les cibles fermées', () => {
  it('standard : le plus gros score devant, puis le plus de cibles fermées', () => {
    const partie = resumeCricket([
      { nom: 'Julien', score: 22 },
      { nom: 'Sarah', score: 86 },
      { nom: 'Kevin', score: 61, closedTargets: 3 },
      { nom: 'Lucie', score: 61, closedTargets: 5 },
    ])
    expect(noms(rankPlayers(partie))).toEqual(['Sarah', 'Lucie', 'Kevin', 'Julien'])
  })

  it('cut-throat : le PLUS PETIT score devant (le sens s’inverse)', () => {
    const partie = resumeCricket(
      [
        { nom: 'Sarah', score: 75 },
        { nom: 'Julien', score: 15 },
        { nom: 'Kevin', score: 40 },
      ],
      { variant: 'CUT_THROAT' },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Julien', 'Kevin', 'Sarah'])
  })

  it('cut-throat : à score égal, le plus de cibles fermées reste devant', () => {
    const partie = resumeCricket(
      [
        { nom: 'Kevin', score: 15, closedTargets: 2 },
        { nom: 'Julien', score: 15, closedTargets: 6 },
      ],
      { variant: 'CUT_THROAT' },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Julien', 'Kevin'])
  })

  it('le vainqueur déclaré passe devant, quel que soit le sens du score', () => {
    const partie = resumeCricket(
      [
        { nom: 'Julien', score: 10 },
        { nom: 'Sarah', score: 5 },
      ],
      { gagnant: 'Sarah' },
    )
    expect(noms(rankPlayers(partie))).toEqual(['Sarah', 'Julien'])
  })
})

describe('rankPlayers — Tour du monde : ceux qui ont bouclé, le moins de fléchettes d’abord', () => {
  it('les bouclés d’abord (fléchettes croissantes), puis la cible la plus avancée', () => {
    const partie = resumeTourDuMonde([
      { nom: 'Kevin', targetIndex: 19 },
      { nom: 'Sarah', targetIndex: 21, finishedInDarts: 55 },
      { nom: 'Lucie', targetIndex: 16 },
      { nom: 'Julien', targetIndex: 21, finishedInDarts: 48 },
    ])
    expect(noms(rankPlayers(partie))).toEqual(['Julien', 'Sarah', 'Kevin', 'Lucie'])
  })

  it('personne n’a bouclé : la cible la plus avancée devant', () => {
    const partie = resumeTourDuMonde([
      { nom: 'Kevin', targetIndex: 14 },
      { nom: 'Sarah', targetIndex: 18 },
    ])
    expect(noms(rankPlayers(partie))).toEqual(['Sarah', 'Kevin'])
  })
})

describe('rankPlayers — égalité, entraînement, cas limites', () => {
  it('égalité parfaite : l’ordre de jeu reste, rien n’est inventé', () => {
    const partie = resumeX01([
      { nom: 'Kevin', remaining: 100 },
      { nom: 'Sarah', remaining: 100 },
      { nom: 'Julien', remaining: 100 },
    ])
    expect(noms(rankPlayers(partie))).toEqual(['Kevin', 'Sarah', 'Julien'])
  })

  it('entraînement : un seul joueur, tel quel', () => {
    expect(noms(rankPlayers(resumeEntrainement()))).toEqual(['Kevin'])
  })

  it('un seul joueur', () => {
    const partie = resumeX01([{ nom: 'Kevin', remaining: 301 }])
    expect(noms(rankPlayers(partie))).toEqual(['Kevin'])
  })

  it('un profil supprimé (name: null) est classé comme les autres', () => {
    const partie = resumeCricket([
      { nom: 'Kevin', score: 10 },
      { nom: null, score: 40 },
    ])
    expect(noms(rankPlayers(partie))).toEqual([null, 'Kevin'])
  })

  it('ne mute pas la liste d’origine', () => {
    const partie = resumeX01([
      { nom: 'Kevin', remaining: 200 },
      { nom: 'Sarah', remaining: 100 },
    ])
    const avant = noms(partie.players)
    rankPlayers(partie)
    expect(noms(partie.players)).toEqual(avant)
  })
})

describe('leadingPlayers — les ex æquo en tête (toutes les clés)', () => {
  it('un vainqueur : seul', () => {
    const partie = resumeX01(
      [
        { nom: 'Kevin', remaining: 0 },
        { nom: 'Julien', remaining: 0 },
      ],
      { gagnant: 'Kevin' },
    )
    expect(noms(leadingPlayers(partie))).toEqual(['Kevin'])
  })

  it('Tour du monde nul : les deux bouclés à égalité de fléchettes', () => {
    const partie = resumeTourDuMonde(
      [
        { nom: 'Kevin', targetIndex: 21, finishedInDarts: 50 },
        { nom: 'Sarah', targetIndex: 21, finishedInDarts: 50 },
        { nom: 'Julien', targetIndex: 21, finishedInDarts: 60 },
      ],
      { finished: true },
    )
    expect(noms(leadingPlayers(partie))).toEqual(['Kevin', 'Sarah'])
  })

  it('Cricket sans vainqueur : ceux qui ont le même score et les mêmes cibles', () => {
    const partie = resumeCricket(
      [
        { nom: 'Kevin', score: 40, closedTargets: 7 },
        { nom: 'Sarah', score: 40, closedTargets: 7 },
        { nom: 'Julien', score: 40, closedTargets: 5 },
      ],
      { finished: true },
    )
    expect(noms(leadingPlayers(partie))).toEqual(['Kevin', 'Sarah'])
  })

  it('entraînement : le joueur seul', () => {
    expect(noms(leadingPlayers(resumeEntrainement()))).toEqual(['Kevin'])
  })
})
