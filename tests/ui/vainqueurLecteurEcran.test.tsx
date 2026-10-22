import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TableauCricket } from '@/ui/composants/cricket/TableauCricket'
import { LigneCible } from '@/ui/composants/tour-du-monde/LigneCible'
import { LigneJoueur } from '@/ui/composants/x01/LigneJoueur'
import { LIBELLE_VAINQUEUR } from '@/ui/labels'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

const MENTION = `, ${LIBELLE_VAINQUEUR}`

const LIGNE_X01 = {
  nom: 'Kevin',
  couleur: null,
  reste: 0,
  actif: false,
  volee: null,
  legsGagnes: 2,
  legsRequis: 2,
  setsGagnes: 0,
  setsRequis: 1,
  moyenne: 60,
  echelle: 'large',
} as const

const LIGNE_CIBLE = {
  nom: 'Kevin',
  couleur: null,
  cible: null,
  validees: 21,
  total: 21,
  flechettes: 30,
  actif: false,
  nbJoueurs: 2,
  volee: [],
  etiquetteVolee: 'Dernière volée de Kevin',
} as const

const cricket = (vainqueur: boolean) => ({
  cibles: [20, 19, 18, 17, 16, 15, 'BULL'] as const,
  mortes: [false, false, false, false, false, false, false],
  cutThroat: false,
  volee: { nom: 'Kevin', darts: [] },
  joueurs: [
    {
      playerId: 'p1',
      nom: 'Kevin',
      couleur: null,
      marks: [3, 3, 3, 3, 3, 3, 3],
      score: 0,
      actif: false,
      vainqueur,
    },
  ],
})

describe('Couronne du vainqueur — le sens passe par un texte pour les lecteurs d’écran', () => {
  const { services } = fakeServices()

  it.each([true, false])('X01, LigneJoueur (vainqueur : %s)', (vainqueur) => {
    renderWithServices(<LigneJoueur {...LIGNE_X01} vainqueur={vainqueur} />, { services })
    if (vainqueur) expect(screen.getByText(MENTION)).toBeTruthy()
    else expect(screen.queryByText(MENTION)).toBeNull()
  })

  it.each([true, false])('Tour du monde, LigneCible (vainqueur : %s)', (vainqueur) => {
    renderWithServices(<LigneCible {...LIGNE_CIBLE} vainqueur={vainqueur} />, { services })
    if (vainqueur) expect(screen.getByText(MENTION)).toBeTruthy()
    else expect(screen.queryByText(MENTION)).toBeNull()
  })

  it.each([true, false])('Cricket, TableauCricket (vainqueur : %s)', (vainqueur) => {
    renderWithServices(<TableauCricket {...cricket(vainqueur)} />, { services })
    if (vainqueur) {
      expect(screen.getByText(MENTION)).toBeTruthy()
    } else {
      expect(screen.queryByText(MENTION)).toBeNull()
    }
  })
})
