import { describe, expect, it } from 'vitest'
import { nomTape } from '@/ui/hooks/useNouvellePartie'
import { JOURS, nomDePartie, nomParDefaut } from '@/ui/labels'

/**
 * Le nom par défaut d'une partie : « Jour tranche », à l'heure **locale**.
 * Toutes les dates sont construites en heure locale (`new Date(a, m, j, h, min)`),
 * jamais en UTC : sinon le test dépendrait du fuseau de la machine.
 */
const le = (jour: number, heure: number, minute = 0, mois = 9, annee = 2026): number =>
  new Date(annee, mois, jour, heure, minute).getTime()

describe('Nom par défaut — « Jour tranche »', () => {
  it('le 11 octobre 2026 est bien un dimanche (repère des tests)', () => {
    expect(new Date(le(11, 12)).getDay()).toBe(0)
  })

  /** Critère 1. */
  it('propose « Dimanche soir » un dimanche à 21 h', () => {
    expect(nomParDefaut(le(11, 21))).toBe('Dimanche soir')
  })

  /**
   * Critère 2 (amendé) : chaque borne, des deux côtés. Le dimanche 11 octobre
   * 2026. La nuit porte le nom du jour du calendrier, pas celui de la veille.
   */
  it.each([
    [0, 0, 'Dimanche nuit'],
    [4, 59, 'Dimanche nuit'],
    [5, 0, 'Dimanche matin'],
    [11, 59, 'Dimanche matin'],
    [12, 0, 'Dimanche après-midi'],
    [17, 59, 'Dimanche après-midi'],
    [18, 0, 'Dimanche soir'],
    [23, 59, 'Dimanche soir'],
  ])('à %ih%i, dit « %s »', (heure, minute, attendu) => {
    expect(nomParDefaut(le(11, heure, minute))).toBe(attendu)
  })

  it('nomme la nuit d’après le jour du calendrier, sans rattachement à la veille', () => {
    // Samedi 1 h : la nuit de samedi.
    expect(nomParDefaut(le(10, 1))).toBe('Samedi nuit')
    // Dimanche 1 h : la nuit de dimanche — pas « Samedi nuit ».
    expect(nomParDefaut(le(11, 1))).toBe('Dimanche nuit')
    // Lundi 0 h : la nuit de lundi — pas « Dimanche nuit ».
    expect(nomParDefaut(le(12, 0))).toBe('Lundi nuit')
  })

  it('connaît les sept nuits, chacune à son jour', () => {
    // Du lundi 12 au dimanche 18 octobre 2026, à 2 h.
    const nuits = [12, 13, 14, 15, 16, 17, 18].map((jour) => nomParDefaut(le(jour, 2)))
    expect(nuits).toEqual([
      'Lundi nuit',
      'Mardi nuit',
      'Mercredi nuit',
      'Jeudi nuit',
      'Vendredi nuit',
      'Samedi nuit',
      'Dimanche nuit',
    ])
  })

  it('connaît les sept jours, dans l’ordre de `getDay()`', () => {
    expect(JOURS).toEqual(['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'])
    // Du lundi 12 au dimanche 18 octobre 2026, l'après-midi.
    const semaine = [12, 13, 14, 15, 16, 17, 18].map((jour) => nomParDefaut(le(jour, 15)))
    expect(semaine).toEqual([
      'Lundi après-midi',
      'Mardi après-midi',
      'Mercredi après-midi',
      'Jeudi après-midi',
      'Vendredi après-midi',
      'Samedi après-midi',
      'Dimanche après-midi',
    ])
  })

  /**
   * Les jours de changement d'heure durent 23 ou 25 h : un calcul qui
   * décalerait l'horodatage d'un nombre d'heures tomberait sur la mauvaise
   * tranche ou le mauvais jour. Dimanches 29 mars et 25 octobre 2026.
   *
   * ⚠️ Ces cas n'ont de sens que dans un fuseau à heure d'été : le fuseau des
   * tests est fixé (`test.env.TZ` dans `vite.config.ts`), et la précondition
   * ci-dessous fait échouer le test haut et fort si ce réglage se perdait,
   * plutôt que de le laisser vert à vide.
   */
  it.each([
    [29, 'mars', 2, 23],
    [25, 'octobre', 9, 25],
  ] as const)('ne se trompe pas de jour le %i %s (changement d’heure)', (jour, _, mois, heures) => {
    // Précondition : ce jour-là dure bien `heures` heures dans le fuseau des tests.
    expect(le(jour + 1, 0, 0, mois) - le(jour, 0, 0, mois)).toBe(heures * 3_600_000)

    expect(nomParDefaut(le(jour, 4, 59, mois))).toBe('Dimanche nuit')
    expect(nomParDefaut(le(jour, 5, 0, mois))).toBe('Dimanche matin')
    expect(nomParDefaut(le(jour, 23, 59, mois))).toBe('Dimanche soir')
  })
})

describe('nomDePartie — le nom affiché', () => {
  it('préfère le nom tapé', () => {
    expect(nomDePartie({ name: 'Finale des potes', createdAt: le(11, 21) })).toBe(
      'Finale des potes',
    )
  })

  it('retombe sur le nom de la date de création sans nom tapé', () => {
    expect(nomDePartie({ name: null, createdAt: le(11, 21) })).toBe('Dimanche soir')
  })
})

/** Ce qui part dans la commande de lancement : un nom tapé, ou rien du tout. */
describe('nomTape — tapé ou non', () => {
  it('rend le nom tapé, sans les espaces autour', () => {
    expect(nomTape('  Finale des potes  ', 'Dimanche soir')).toEqual({ name: 'Finale des potes' })
  })

  it.each(['', '    ', 'Dimanche soir', '  Dimanche soir '])(
    'ne rend aucune clé pour %j (vide, espaces, ou la proposition)',
    (saisie) => {
      expect(nomTape(saisie, 'Dimanche soir')).toStrictEqual({})
    },
  )
})
