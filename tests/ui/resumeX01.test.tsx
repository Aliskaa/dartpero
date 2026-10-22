import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { type LigneStat, rangDuMeneur, TableauJoueurs } from '@/ui/composants/commun/TableauJoueurs'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

type Ligne = { readonly nom: string; readonly valeur: number }

const ligne = (valeur: number): Ligne => ({ nom: `j${valeur}`, valeur })

const PAR_VALEUR: LigneStat<Ligne> = {
  libelle: 'Valeur',
  valeur: (j) => j.valeur,
  meilleur: (j) => j.valeur,
}

describe('Meneur d’une ligne', () => {
  it('désigne le plus grand', () => {
    expect(rangDuMeneur([ligne(10), ligne(40), ligne(20)], PAR_VALEUR)).toBe(1)
  })

  // ⚠️ Le cas le plus fréquent d'un match entre potes : « 180 » vaut zéro pour
  // tout le monde. Dorer le premier de la liste lui inventerait un exploit.
  it('ne désigne personne à égalité', () => {
    expect(rangDuMeneur([ligne(0), ligne(0), ligne(0)], PAR_VALEUR)).toBe(-1)
    expect(rangDuMeneur([ligne(7), ligne(7)], PAR_VALEUR)).toBe(-1)
    expect(rangDuMeneur([ligne(9), ligne(9), ligne(2)], PAR_VALEUR)).toBe(-1)
  })

  it('désigne l’unique joueur d’une partie solo', () => {
    expect(rangDuMeneur([ligne(0)], PAR_VALEUR)).toBe(0)
  })

  it('suit la clé qu’on lui donne, pas la valeur affichée', () => {
    const meilleureManche: LigneStat<Ligne> = {
      libelle: 'Meilleure manche',
      valeur: (j) => j.valeur,
      meilleur: (j) => -j.valeur,
    }
    expect(rangDuMeneur([ligne(21), ligne(15), ligne(30)], meilleureManche)).toBe(1)
  })
})

describe('La feuille de match (tableau transposé)', () => {
  const JOUEURS: readonly Ligne[] = [ligne(140), ligne(60)]
  const COLONNES = [
    { id: 'a', nom: 'Kevin', couleur: null, vainqueur: true },
    { id: 'b', nom: 'Julien', couleur: null },
  ]

  const poser = (lignes: readonly LigneStat<Ligne>[]) =>
    render(
      <TableauJoueurs
        libelle="Statistiques de la partie"
        colonnes={COLONNES}
        joueurs={JOUEURS}
        lignes={lignes}
      />,
    )

  it('met les joueurs en colonnes et les statistiques en lignes', () => {
    poser([PAR_VALEUR])

    const tableau = screen.getByRole('table', { name: 'Statistiques de la partie' })

    // ⚠️ Par le nom accessible, pas `textContent` : la pastille d'avatar est `aria-hidden`.
    const enTetes = within(tableau).getAllByRole('columnheader')
    expect(enTetes).toHaveLength(2)
    expect(
      within(tableau).getByRole('columnheader', { name: 'Kevin, vainqueur' }),
    ).toBeInTheDocument()
    expect(within(tableau).getByRole('columnheader', { name: 'Julien' })).toBeInTheDocument()
    expect(within(tableau).getByRole('rowheader', { name: 'Valeur' })).toBeInTheDocument()
  })

  it('range chaque chiffre sous son joueur', () => {
    poser([PAR_VALEUR])

    const rangee = screen.getByRole('row', { name: /Valeur/ })
    expect(
      within(rangee)
        .getAllByRole('cell')
        .map((cellule) => cellule.textContent),
    ).toEqual(['140', '60'])
  })

  it('garde une ligne par statistique, dans l’ordre donné', () => {
    poser([
      { libelle: 'Moyenne', valeur: (j) => j.valeur, meilleur: (j) => j.valeur },
      { libelle: '180', valeur: () => 0, meilleur: () => 0 },
    ])

    expect(screen.getAllByRole('rowheader').map((cellule) => cellule.textContent)).toEqual([
      'Moyenne',
      '180',
    ])
  })
})

describe('Le résumé de partie, de bout en bout', () => {
  const partieJouee = async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 501, legsToWin: 1, doubleOut: false }),
    })
    const T20 = [Dart.triple(20), Dart.triple(20), Dart.triple(20)]
    const PETIT = [Dart.single(5), Dart.single(1), Dart.miss()]

    await services.recordVisit.execute({ matchId, darts: T20 })
    await services.recordVisit.execute({ matchId, darts: PETIT })
    await services.recordVisit.execute({ matchId, darts: T20 })
    await services.recordVisit.execute({ matchId, darts: PETIT })
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.triple(20), Dart.triple(19), Dart.double(12)],
    })

    return { services, matchId }
  }

  it('met les joueurs en colonnes de la feuille, vainqueur en tête', async () => {
    const { services, matchId } = await partieJouee()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    const feuille = await screen.findByRole('table', { name: 'Statistiques de la partie' })

    expect(
      within(feuille).getByRole('columnheader', { name: 'Kevin, vainqueur' }),
    ).toBeInTheDocument()
    expect(within(feuille).getByRole('columnheader', { name: 'Julien' })).toBeInTheDocument()

    const meilleure = within(feuille).getByRole('row', { name: /Meilleure manche/ })
    expect(within(meilleure).getAllByRole('cell')[0]).toHaveTextContent('9')
    expect(within(meilleure).getAllByRole('cell')[1]).toHaveTextContent('—')
  })

  // ⚠️ « T'as tapé où ce soir » : plus de sens par match que sur un cumul de carrière.
  it('montre où les fléchettes de CETTE partie se sont plantées', async () => {
    const { services, matchId } = await partieJouee()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    expect(await screen.findByRole('img', { name: /^Kevin : T20 7 fois/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Julien : / })).toBeInTheDocument()
    expect(screen.getByText('Hors cible ×2')).toBeInTheDocument()
  })

  // ⚠️ Cette fixture joue en `doubleOut: false` : Kevin GAGNE son leg sur un D12.
  it('écrit un tiret pour « % doubles » quand double out est désactivé, même pour le vainqueur du leg', async () => {
    const { services, matchId } = await partieJouee()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    const feuille = await screen.findByRole('table', { name: 'Statistiques de la partie' })
    const ligne = within(feuille).getByRole('row', { name: /% doubles/ })
    const cellules = within(ligne).getAllByRole('cell')

    expect(cellules[0]).toHaveTextContent('—')
    expect(cellules[1]).toHaveTextContent('—')
  })
})

describe('% doubles — pourcentage réel vs zéro réel vs absence de tentative', () => {
  const partieAvecCheckoutReussi = async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.miss(), Dart.miss(), Dart.double(20)],
    })

    return { services, matchId }
  }

  const partieAvecDoubleRate = async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const matchId = await services.startMatch.execute({
      playerIds: [kevin.id, julien.id],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({
      matchId,
      darts: [Dart.miss(), Dart.miss(), Dart.miss()],
    })

    return { services, matchId }
  }

  it('affiche un pourcentage arrondi pour un joueur qui a tenté, un tiret pour celui qui n’a rien tenté', async () => {
    const { services, matchId } = await partieAvecCheckoutReussi()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    const feuille = await screen.findByRole('table', { name: 'Statistiques de la partie' })
    const ligne = within(feuille).getByRole('row', { name: /% doubles/ })
    const cellules = within(ligne).getAllByRole('cell')

    expect(cellules[0]).toHaveTextContent('33 %')
    expect(cellules[1]).toHaveTextContent('—')
  })

  it('affiche « 0 % », jamais un tiret, pour un joueur qui a tenté un double et raté toutes ses tentatives', async () => {
    const { services, matchId } = await partieAvecDoubleRate()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    const feuille = await screen.findByRole('table', { name: 'Statistiques de la partie' })
    const ligne = within(feuille).getByRole('row', { name: /% doubles/ })
    const cellules = within(ligne).getAllByRole('cell')

    expect(cellules[0]).toHaveTextContent('0 %')
    expect(cellules[0]).not.toHaveTextContent('—')
    expect(cellules[1]).toHaveTextContent('—')
  })
})
