import { describe, expect, it } from 'vitest'
import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { ariaRejouer, libelleDateRelative, resumeRejouer, titreRejouer } from '@/ui/labels'
import { MAX_JOUEURS } from '@/ui/reglagesPossibles'
import { configurationsAffichees, estReproductible } from '@/ui/rejouer'

const kevin = 'kevin' as PlayerId
const julien = 'julien' as PlayerId

const commun = (rang: number, ids: readonly PlayerId[] = [kevin, julien]) => ({
  key: `cle-${rang}`,
  playerIds: ids,
  count: 1,
  lastPlayedAt: 1_000_000 - rang,
})

const x01 = (reglages: Parameters<typeof X01Config.create>[0] = {}, rang = 0) =>
  ({ ...commun(rang), mode: 'X01', config: X01Config.create(reglages) }) as ReplayableConfiguration

describe('Rejouer — le filtre « reproductible »', () => {
  it('garde une valeur de chaque liste de l’étape 2', () => {
    expect(estReproductible(x01({ startingScore: 701, legsToWin: 4, setsToWin: 3 }))).toBe(true)
  })

  it.each([
    ['un score hors liste', { startingScore: 401 }],
    ['un nombre de manches hors liste', { legsToWin: 7 }],
    ['un nombre de sets hors liste', { setsToWin: 5 }],
  ])('écarte %s', (_, reglages) => {
    expect(estReproductible(x01(reglages))).toBe(false)
  })

  it.each([
    ['une sortie en chaîne', { doubleOut: 'oui' }],
    ['une sortie "false" en chaîne', { doubleOut: 'false' }],
    ['une entrée en chaîne', { doubleIn: 'oui' }],
    ['une sortie absente', { doubleOut: undefined }],
  ])('écarte un X01 importé avec %s', (_, abime) => {
    const configuration = x01()
    const abimee = {
      ...configuration,
      config: { ...configuration.config, ...abime },
    } as unknown as ReplayableConfiguration
    expect(estReproductible(abimee)).toBe(false)
  })

  it('écarte une configuration de plus de 4 joueurs (MAX_JOUEURS), garde celle de 4', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'] as PlayerId[]
    const avec = (n: number) =>
      ({ ...x01(), playerIds: ids.slice(0, n) }) as ReplayableConfiguration
    expect(estReproductible(avec(MAX_JOUEURS))).toBe(true)
    expect(estReproductible(avec(MAX_JOUEURS + 1))).toBe(false)
    expect(MAX_JOUEURS).toBe(4)
  })

  it('écarte des cibles qui ne sont pas celles du défaut (Cricket, Tour du monde)', () => {
    const cricket = (cibles: CricketConfig['targets']) =>
      ({
        ...commun(0),
        mode: 'CRICKET',
        config: CricketConfig.create({ targets: cibles }),
      }) as ReplayableConfiguration
    expect(estReproductible(cricket(CricketConfig.create().targets))).toBe(true)
    expect(estReproductible(cricket([20, 19, 18]))).toBe(false)

    const monde = (cibles: TourDuMondeConfig['targets']) =>
      ({
        ...commun(0),
        mode: 'TOUR_DU_MONDE',
        config: TourDuMondeConfig.create({ targets: cibles }),
      }) as ReplayableConfiguration
    expect(estReproductible(monde(TourDuMondeConfig.create().targets))).toBe(true)
    expect(estReproductible(monde([20, 19]))).toBe(false)
  })

  it('écarte un nombre de checkouts hors liste ou une plage de restes qui n’est pas celle du défaut', () => {
    const entrainement = (reglages: Parameters<typeof CheckoutPracticeConfig.create>[0]) =>
      ({
        ...commun(0, [kevin]),
        mode: 'CHECKOUT_PRACTICE',
        config: CheckoutPracticeConfig.create(reglages),
      }) as ReplayableConfiguration
    expect(estReproductible(entrainement({ rounds: 20 }))).toBe(true)
    expect(estReproductible(entrainement({ rounds: 7 }))).toBe(false)
    expect(estReproductible(entrainement({ minTarget: 60 }))).toBe(false)
    expect(estReproductible(entrainement({ maxTarget: 100 }))).toBe(false)
  })

  it('écarte un entraînement importé à plusieurs joueurs, garde celui d’un seul', () => {
    const entrainement = (ids: readonly PlayerId[]) =>
      ({
        ...commun(0, ids),
        mode: 'CHECKOUT_PRACTICE',
        config: CheckoutPracticeConfig.create(),
      }) as ReplayableConfiguration
    expect(estReproductible(entrainement([kevin]))).toBe(true)
    expect(estReproductible(entrainement([kevin, julien]))).toBe(false)
  })

  it('filtre d’abord, puis coupe à trois : la suivante prend la place d’une écartée', () => {
    const liste = [
      x01({ startingScore: 401 }, 0), // non reproductible
      x01({ startingScore: 301 }, 1),
      x01({ startingScore: 501 }, 2),
      x01({ startingScore: 701 }, 3),
      x01({ legsToWin: 3 }, 4), // la quatrième reproductible : coupée
    ]
    expect(configurationsAffichees(liste).map((c) => c.key)).toEqual(['cle-1', 'cle-2', 'cle-3'])
  })

  it('écarte aussi une configuration dont un profil n’existe plus', () => {
    const liste = [x01({}, 0), x01({ startingScore: 301 }, 1)]
    expect(configurationsAffichees(liste, (id) => id !== julien)).toEqual([])
    expect(configurationsAffichees(liste, () => true)).toHaveLength(2)
  })
})

describe('Rejouer — les libellés', () => {
  const ouverture = Date.UTC(2026, 9, 14, 20) // mercredi 14 octobre 2026, 22 h à Paris
  const local = (annee: number, mois: number, jour: number, heure = 21) =>
    new Date(annee, mois, jour, heure).getTime()
  const maintenant = local(2026, 9, 14, 22)

  it.each([
    ['aujourd’hui', local(2026, 9, 14, 0)],
    ['hier', local(2026, 9, 13, 23)],
    ['lundi', local(2026, 9, 12)],
    ['jeudi', local(2026, 9, 8)],
    ['7 oct.', local(2026, 9, 7)],
    ['3 oct.', local(2026, 9, 3)],
    ['3 oct. 2025', local(2025, 9, 3)],
  ])('date « %s »', (attendu, horodatage) => {
    expect(libelleDateRelative(horodatage, maintenant).replace(/ /g, ' ')).toBe(attendu)
  })

  it.each([
    ['25 octobre 2026', 9, 25, 25],
    ['29 mars 2026', 2, 29, 23],
  ] as const)(
    'compte les jours sur le calendrier local, même le %s (changement d’heure)',
    (_, mois, jour, heures) => {
      expect(local(2026, mois, jour + 1, 0) - local(2026, mois, jour, 0)).toBe(heures * 3_600_000)

      const soir = local(2026, mois, jour, 23)
      expect(libelleDateRelative(local(2026, mois, jour - 1, 12), soir)).toBe('hier')
      expect(libelleDateRelative(local(2026, mois, jour, 0), soir)).toBe('aujourd’hui')
      expect(libelleDateRelative(local(2026, mois, jour - 1, 0), soir)).toBe('hier')
      expect(
        libelleDateRelative(local(2026, mois, jour, 12), local(2026, mois, jour + 1, 12)),
      ).toBe('hier')
    },
  )

  it('lit « aujourd’hui » une date postérieure à l’horloge (jamais un écart négatif)', () => {
    expect(libelleDateRelative(ouverture + 86_400_000 * 3, maintenant)).toBe('aujourd’hui')
  })

  it('résume X01 : manches, sets s’il y en a, sortie, entrée seulement si activée', () => {
    const base = { ...x01({ doubleOut: false }), lastPlayedAt: local(2026, 9, 13), count: 4 }
    expect(resumeRejouer(base, maintenant)).toBe(
      'premier à 2 manches · checkout libre · hier · 4 fois',
    )

    const complet = {
      ...x01({ legsToWin: 1, setsToWin: 2, doubleOut: true, doubleIn: true }),
      lastPlayedAt: local(2026, 9, 14),
    }
    expect(resumeRejouer(complet, maintenant)).toBe(
      'premier à 2 sets · 1 manche par set · checkout sur un double · entrée sur un double · aujourd’hui',
    )
  })

  it('masque « N fois » à 1 et l’affiche dès 2', () => {
    const une = { ...x01(), lastPlayedAt: local(2026, 9, 14), count: 1 }
    const deux = { ...une, count: 2 }
    expect(resumeRejouer(une, maintenant)).not.toContain('fois')
    expect(resumeRejouer(deux, maintenant)).toContain('2 fois')
  })

  it('résume et titre les trois autres modes', () => {
    const cricket = {
      ...commun(0),
      mode: 'CRICKET',
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
      lastPlayedAt: local(2026, 9, 14),
    } as ReplayableConfiguration
    expect(titreRejouer(cricket)).toBe('Cricket · Cut-throat')
    expect(resumeRejouer(cricket, maintenant)).toBe('7 cibles · aujourd’hui')

    const monde = {
      ...commun(0),
      mode: 'TOUR_DU_MONDE',
      config: TourDuMondeConfig.create(),
      lastPlayedAt: local(2026, 9, 14),
    } as ReplayableConfiguration
    expect(titreRejouer(monde)).toBe('Tour du monde')
    expect(resumeRejouer(monde, maintenant)).toBe('20 → 1, puis la bulle · aujourd’hui')

    const entrainement = {
      ...commun(0, [kevin]),
      mode: 'CHECKOUT_PRACTICE',
      config: CheckoutPracticeConfig.create({ rounds: 10 }),
      lastPlayedAt: local(2026, 9, 14),
    } as ReplayableConfiguration
    expect(titreRejouer(entrainement)).toBe('Entraînement')
    expect(resumeRejouer(entrainement, maintenant)).toBe('10 checkouts · aujourd’hui')
  })

  it('dit le jeu et tous les pseudos dans le nom accessible de ▶', () => {
    expect(ariaRejouer(x01(), ['Kevin', 'Julien', 'Sarah'])).toBe(
      'Rejouer X01 501 avec Kevin, Julien et Sarah',
    )
    expect(ariaRejouer(x01(), ['Kevin', 'Julien'])).toBe('Rejouer X01 501 avec Kevin et Julien')
    const solo = {
      ...commun(0, [kevin]),
      mode: 'CHECKOUT_PRACTICE',
      config: CheckoutPracticeConfig.create({ rounds: 10 }),
    } as ReplayableConfiguration
    expect(ariaRejouer(solo, ['Kevin'])).toBe('Lancer Entraînement 10 checkouts avec Kevin')
  })
})
