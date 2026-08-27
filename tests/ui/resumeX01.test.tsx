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

  /**
   * ⚠️ Le cas le plus fréquent d'un match entre potes : « 180 » vaut zéro pour
   * tout le monde. Dorer le premier de la liste lui inventerait un exploit.
   */
  it('ne désigne personne à égalité', () => {
    expect(rangDuMeneur([ligne(0), ligne(0), ligne(0)], PAR_VALEUR)).toBe(-1)
    expect(rangDuMeneur([ligne(7), ligne(7)], PAR_VALEUR)).toBe(-1)
    // Une égalité en tête suffit, même si quelqu'un est derrière.
    expect(rangDuMeneur([ligne(9), ligne(9), ligne(2)], PAR_VALEUR)).toBe(-1)
  })

  it('désigne l’unique joueur d’une partie solo', () => {
    expect(rangDuMeneur([ligne(0)], PAR_VALEUR)).toBe(0)
  })

  /**
   * Le meilleur leg est le seul classement du projet où **petit** vaut mieux
   * que grand : l'appelant rend l'opposé, le composant n'a pas à le savoir.
   */
  it('suit la clé qu’on lui donne, pas la valeur affichée', () => {
    const meilleurLeg: LigneStat<Ligne> = {
      libelle: 'Meilleur leg',
      valeur: (j) => j.valeur,
      meilleur: (j) => -j.valeur,
    }
    expect(rangDuMeneur([ligne(21), ligne(15), ligne(30)], meilleurLeg)).toBe(1)
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

    // ⚠️ Par le **nom accessible**, pas par `textContent` : la pastille
    // d'avatar est `aria-hidden` et ses initiales n'entrent donc pas dans
    // l'annonce, mais elles sont bien dans le texte brut du DOM.
    const enTetes = within(tableau).getAllByRole('columnheader')
    expect(enTetes).toHaveLength(2)
    expect(within(tableau).getByRole('columnheader', { name: 'Kevin' })).toBeInTheDocument()
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
  /** Un 501 en tête-à-tête, gagné par Kevin, avec de quoi remplir la feuille. */
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
    // 141 restants : Kevin sort.
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

    expect(within(feuille).getByRole('columnheader', { name: 'Kevin' })).toBeInTheDocument()
    expect(within(feuille).getByRole('columnheader', { name: 'Julien' })).toBeInTheDocument()

    // 501 en 9 fléchettes : le leg le plus court possible.
    const meilleurLeg = within(feuille).getByRole('row', { name: /Meilleur leg/ })
    expect(within(meilleurLeg).getAllByRole('cell')[0]).toHaveTextContent('9')
    // Julien n'a gagné aucun leg : il n'a pas « 0 fléchette », il n'a rien.
    expect(within(meilleurLeg).getAllByRole('cell')[1]).toHaveTextContent('—')
  })

  /**
   * ⚠️ La question que le résumé doit savoir poser : « t'as tapé où ce soir ».
   * Elle a plus de sens par match que sur un cumul de carrière, où six mois de
   * parties finissent par se ressembler.
   */
  it('montre où les fléchettes de CETTE partie se sont plantées', async () => {
    const { services, matchId } = await partieJouee()
    renderWithServices(<App />, { services, route: `/partie/${matchId}/resume` })

    // Kevin : 7 T20 sur 9 fléchettes. Le nom accessible porte la donnée.
    expect(await screen.findByRole('img', { name: /^Kevin : T20 7 fois/ })).toBeInTheDocument()
    // Julien : deux fléchettes hors cible, comptées sans chauffer de case.
    expect(screen.getByRole('img', { name: /^Julien : / })).toBeInTheDocument()
    expect(screen.getByText('Hors cible ×2')).toBeInTheDocument()
  })
})
