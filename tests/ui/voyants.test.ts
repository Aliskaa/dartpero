import { describe, expect, it } from 'vitest'
import { joursCalendairesEntre } from '@/ui/jourCalendaire'
import { libelleDureeSauvegarde } from '@/ui/labels'
import { guideInstallationVisible, vueVoyantApplication, vueVoyantSauvegarde } from '@/ui/voyants'

const le = (jour: number, heure = 10, minute = 0) =>
  new Date(2026, 9, jour, heure, minute).getTime()

const voyant = (dernierExport: number | null, maintenant: number) => {
  const vue = vueVoyantSauvegarde(dernierExport, maintenant)
  return { texte: libelleDureeSauvegarde(vue.duree), ton: vue.ton }
}

describe('Voyant « Dernier export »', () => {
  it('« Jamais » sans export, en laiton', () => {
    expect(voyant(null, le(17))).toEqual({ texte: 'Jamais', ton: 'attention' })
  })

  it.each([
    [0, 'Aujourd’hui', 'ok'],
    [1, 'Hier', 'ok'],
    [2, 'Il y a 2 jours', 'ok'],
    [30, 'Il y a 30 jours', 'ok'],
    [31, 'Il y a 31 jours', 'attention'],
    [59, 'Il y a 59 jours', 'attention'],
    [60, 'Il y a 2 mois', 'attention'],
    [89, 'Il y a 2 mois', 'attention'],
    [90, 'Il y a 3 mois', 'attention'],
    [400, 'Il y a 13 mois', 'attention'],
  ] as const)('%i jours : « %s », %s', (jours, texte, ton) => {
    const maintenant = le(1, 12)
    const avant = new Date(2026, 9, 1 - jours, 12).getTime()

    expect(voyant(avant, maintenant)).toEqual({ texte, ton })
  })

  it('compte en jours du calendrier : 23 h 59 la veille, c’est « Hier » à 0 h 01', () => {
    expect(voyant(le(16, 23, 59), le(17, 0, 1)).texte).toBe('Hier')
    expect(voyant(le(17, 0, 1), le(17, 23, 59)).texte).toBe('Aujourd’hui')
  })

  it('le passage à l’heure d’hiver (jour de 25 h) ne décale rien', () => {
    expect(le(26, 0) - le(25, 0)).toBe(25 * 3_600_000)

    expect(voyant(le(24, 23, 30), le(25, 23, 30)).texte).toBe('Hier')
    expect(voyant(le(25, 0, 10), le(26, 0, 5)).texte).toBe('Hier')
    expect(joursCalendairesEntre(le(24, 12), le(26, 12))).toBe(2)
  })

  it('le passage à l’heure d’été (jour de 23 h) ne décale rien', () => {
    const mars = (jour: number, heure: number, minute = 0) =>
      new Date(2026, 2, jour, heure, minute).getTime()
    expect(mars(30, 0) - mars(29, 0)).toBe(23 * 3_600_000)

    expect(joursCalendairesEntre(mars(28, 23, 30), mars(29, 23, 30))).toBe(1)
    expect(joursCalendairesEntre(mars(29, 0, 10), mars(30, 0, 5))).toBe(1)
  })

  it('un jour de 25 h reste un seul jour : 0 h 10 → 23 h 50, « Aujourd’hui »', () => {
    expect(le(26, 0) - le(25, 0)).toBe(25 * 3_600_000)
    expect(voyant(le(25, 0, 10), le(25, 23, 50)).texte).toBe('Aujourd’hui')
  })

  it('un horodatage hors de la plage de Date (1e20) dit « Jamais », en laiton', () => {
    expect(voyant(1e20, le(17))).toEqual({ texte: 'Jamais', ton: 'attention' })
    expect(voyant(-1e20, le(17))).toEqual({ texte: 'Jamais', ton: 'attention' })
  })

  it('une date dans le futur dit « Aujourd’hui », sans alerte', () => {
    expect(voyant(le(20), le(17))).toEqual({ texte: 'Aujourd’hui', ton: 'ok' })
  })
})

describe('Voyant « Application »', () => {
  it.each([
    ['installed', true, 'ok', 'aucune'],
    ['installable', false, 'attention', 'installer'],
    ['ios-manual', false, 'attention', 'comment'],
    ['ios-other-browser', false, 'attention', 'comment'],
    ['unavailable', false, 'attention', 'comment'],
  ] as const)('%s : installée %s, %s, action %s', (etat, installee, ton, action) => {
    expect(vueVoyantApplication(etat)).toEqual({ installee, ton, action })
  })

  it.each([
    ['installed', false],
    ['installable', false],
    ['ios-manual', true],
    ['ios-other-browser', true],
    ['unavailable', true],
  ] as const)('guide #installer en %s : %s', (etat, visible) => {
    expect(guideInstallationVisible(etat)).toBe(visible)
  })
})
