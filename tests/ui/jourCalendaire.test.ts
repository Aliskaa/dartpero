import { describe, expect, it } from 'vitest'
import { groupeDeJour } from '@/ui/jourCalendaire'
import { heureCourte, libelleQuand } from '@/ui/labels'

/** Un instant en heure **locale** (mois 0-indexé, comme `Date`). */
const le = (mois: number, jour: number, heure = 0, minute = 0): number =>
  new Date(2026, mois, jour, heure, minute).getTime()

const OCT = 9
const MAINTENANT = le(OCT, 13, 21, 30) // mardi 13 octobre 2026, 21 h 30

describe('groupeDeJour — aujourd’hui, cette semaine, ou rien', () => {
  it('aujourd’hui : de minuit pile à la dernière minute', () => {
    expect(groupeDeJour(le(OCT, 13, 0, 0), MAINTENANT)).toBe('AUJOURDHUI')
    expect(groupeDeJour(le(OCT, 13, 21, 4), MAINTENANT)).toBe('AUJOURDHUI')
    expect(groupeDeJour(le(OCT, 13, 23, 59), MAINTENANT)).toBe('AUJOURDHUI')
  })

  it('une partie de 23 h 50 n’est plus « Aujourd’hui » à 0 h 10', () => {
    const partie = le(OCT, 13, 23, 50)

    expect(groupeDeJour(partie, le(OCT, 13, 23, 55))).toBe('AUJOURDHUI')
    expect(groupeDeJour(partie, le(OCT, 14, 0, 10))).toBe('CETTE_SEMAINE')
  })

  it('J-6 est dans la semaine dès minuit ; J-7 n’y est plus', () => {
    expect(groupeDeJour(le(OCT, 7, 0, 0), MAINTENANT)).toBe('CETTE_SEMAINE')
    expect(groupeDeJour(le(OCT, 7, 12, 0), MAINTENANT)).toBe('CETTE_SEMAINE')
    expect(groupeDeJour(le(OCT, 12, 23, 59), MAINTENANT)).toBe('CETTE_SEMAINE')

    expect(groupeDeJour(le(OCT, 6, 23, 59), MAINTENANT)).toBeNull()
    expect(groupeDeJour(le(OCT, 6, 12, 0), MAINTENANT)).toBeNull()
  })

  /**
   * Les jours de changement d'heure durent 23 ou 25 h : une borne construite en
   * retranchant `86 400 000 × N` tombe à 1 h ou à 23 h du mauvais jour.
   * Dimanches 29 mars et 25 octobre 2026.
   *
   * ⚠️ Sens uniquement dans un fuseau à heure d'été : le fuseau des tests est
   * fixé (`test.env.TZ` dans `vite.config.ts`), et la précondition fait
   * échouer le test haut et fort si ce réglage se perdait, plutôt que de le
   * laisser vert à vide.
   */
  it('jour de 25 h (25 octobre) : la borne J-6 reste à minuit local', () => {
    expect(le(OCT, 26, 0) - le(OCT, 25, 0)).toBe(25 * 3_600_000)

    // Le 30 octobre, J-6 est le 24, avant le jour de 25 h : la borne naïve
    // (minuit − 6 × 24 h) serait le 24 à 1 h et écarterait cette partie.
    const maintenant = le(OCT, 30, 10, 0)
    expect(groupeDeJour(le(OCT, 24, 0, 30), maintenant)).toBe('CETTE_SEMAINE')
    expect(groupeDeJour(le(OCT, 23, 23, 30), maintenant)).toBeNull()
  })

  it('jour de 25 h : « Aujourd’hui » le jour même, sans fuir sur le lendemain', () => {
    const maintenant = le(OCT, 25, 10, 0)

    expect(groupeDeJour(le(OCT, 25, 0, 30), maintenant)).toBe('AUJOURDHUI')
    expect(groupeDeJour(le(OCT, 25, 23, 59), maintenant)).toBe('AUJOURDHUI')
    expect(groupeDeJour(le(OCT, 24, 23, 30), maintenant)).toBe('CETTE_SEMAINE')
  })

  it('jour de 23 h (29 mars) : la borne J-6 reste à minuit local', () => {
    const MARS = 2
    const AVRIL = 3
    expect(le(MARS, 30, 0) - le(MARS, 29, 0)).toBe(23 * 3_600_000)

    // Le 4 avril, J-6 est le 29 mars (le jour de 23 h). La borne naïve tomberait
    // le 28 à 23 h et y ferait entrer cette partie.
    const maintenant = le(AVRIL, 4, 10, 0)
    expect(groupeDeJour(le(MARS, 29, 0, 30), maintenant)).toBe('CETTE_SEMAINE')
    expect(groupeDeJour(le(MARS, 28, 23, 30), maintenant)).toBeNull()
  })

  describe('une date dans le futur (import, horloge déréglée) ne casse rien', () => {
    it('plus tard le même jour : toujours « Aujourd’hui »', () => {
      expect(groupeDeJour(le(OCT, 13, 23, 59), MAINTENANT)).toBe('AUJOURDHUI')
    })

    it('à partir de demain : écartée de l’Accueil (elle reste dans l’onglet Parties)', () => {
      expect(groupeDeJour(le(OCT, 14, 0, 0), MAINTENANT)).toBeNull()
      expect(groupeDeJour(le(OCT, 20, 12, 0), MAINTENANT)).toBeNull()
      expect(groupeDeJour(new Date(2100, 0, 1).getTime(), MAINTENANT)).toBeNull()
      expect(groupeDeJour(Number.MAX_SAFE_INTEGER, MAINTENANT)).toBeNull()
    })
  })
})

describe('heure et jour affichés', () => {
  it('« 21 h 04 » : l’heure sans zéro devant, les minutes sur deux chiffres', () => {
    expect(heureCourte(le(OCT, 13, 21, 4))).toBe('21 h 04')
    expect(heureCourte(le(OCT, 13, 9, 0))).toBe('9 h 00')
    expect(heureCourte(le(OCT, 13, 0, 5))).toBe('0 h 05')
  })

  it('aujourd’hui : l’heure seule ; dans la semaine : le jour, en minuscules', () => {
    expect(libelleQuand(le(OCT, 13, 21, 4), true)).toBe('21 h 04')
    expect(libelleQuand(le(OCT, 12, 21, 10), false)).toBe('lundi 21 h 10')
    expect(libelleQuand(le(OCT, 7, 20, 10), false)).toBe('mercredi 20 h 10')
  })
})
