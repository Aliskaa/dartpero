import { describe, expect, it } from 'vitest'
import { nomTape } from '@/ui/hooks/useNouvellePartie'
import { JOURS, nomDePartie, nomParDefaut } from '@/ui/labels'

const le = (jour: number, heure: number, minute = 0, mois = 9, annee = 2026): number =>
  new Date(annee, mois, jour, heure, minute).getTime()

describe('Nom par défaut — « Jour tranche »', () => {
  it('le 11 octobre 2026 est bien un dimanche (repère des tests)', () => {
    expect(new Date(le(11, 12)).getDay()).toBe(0)
  })

  it('propose « Dimanche soir » un dimanche à 21 h', () => {
    expect(nomParDefaut(le(11, 21))).toBe('Dimanche soir')
  })

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
    expect(nomParDefaut(le(10, 1))).toBe('Samedi nuit')
    expect(nomParDefaut(le(11, 1))).toBe('Dimanche nuit')
    expect(nomParDefaut(le(12, 0))).toBe('Lundi nuit')
  })

  it('connaît les sept nuits, chacune à son jour', () => {
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

  // ⚠️ Sens uniquement dans un fuseau à heure d'été (fuseau fixé par `test.env.TZ`).
  it.each([
    [29, 'mars', 2, 23],
    [25, 'octobre', 9, 25],
  ] as const)('ne se trompe pas de jour le %i %s (changement d’heure)', (jour, _, mois, heures) => {
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
