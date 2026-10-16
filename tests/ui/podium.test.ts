import { describe, expect, it } from 'vitest'
import type { PlayerCareer } from '@/core/application/ports/driving/GetPlayerStats'
import { DartboardHits } from '@/core/domain/services/dartboardHits'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { decompteBatons, PLAFOND_GROUPES_BATONS } from '@/ui/composants/commun/CompteBatons'
import {
  APERCU_PODIUM,
  apercuPodium,
  classerPodium,
  defilementPourMontrer,
  joueurDeLaCible,
  MESURE_FINITIONS,
  MESURE_GROSSES_VOLEES,
  MESURE_MOYENNE,
  MESURE_VICTOIRES,
  type MesurePodium,
} from '@/ui/podium'

/** Une liste déjà triée, réduite à ses clés : la coupure ne regarde qu'elles. */
const couper = (cles: readonly (number | null)[], n: number) => {
  const { visibles, toutVoir } = apercuPodium(cles, n, (cle) => cle)
  return { nombre: visibles.length, toutVoir }
}

describe('apercuPodium — N premiers, puis « Tout voir » (Révision 1)', () => {
  it('N + 1 lignes au plus : tout, sans bouton', () => {
    expect(couper([9, 8, 7, 6, 5, 4], 5)).toEqual({ nombre: 6, toutVoir: false })
    expect(couper([9, 8, 7, 6], 3)).toEqual({ nombre: 4, toutVoir: false })
    expect(couper([9, 8], 5)).toEqual({ nombre: 2, toutVoir: false })
  })

  it('N + 2 sans égalité à la coupure : N lignes et le bouton', () => {
    expect(couper([9, 8, 7, 6, 5, 4, 3], 5)).toEqual({ nombre: 5, toutVoir: true })
    expect(couper([9, 8, 7, 6, 5], 3)).toEqual({ nombre: 3, toutVoir: true })
  })

  it('exactement deux ex aequo aux rangs N et N + 1 : N + 1 lignes', () => {
    expect(couper([9, 8, 7, 6, 5, 5, 3], 5)).toEqual({ nombre: 6, toutVoir: true })
  })

  it('trois ex aequo à partir du rang N : coupe net à N', () => {
    expect(couper([9, 8, 7, 6, 5, 5, 5, 3], 5)).toEqual({ nombre: 5, toutVoir: true })
  })

  it('groupe commencé avant N (rangs 4, 5, 6 égaux) : coupe net à N (R1-Q1)', () => {
    expect(couper([9, 8, 7, 5, 5, 5, 3], 5)).toEqual({ nombre: 5, toutVoir: true })
  })

  it('égalité qui s’arrête au rang N : N lignes', () => {
    expect(couper([9, 8, 7, 5, 5, 4, 3], 5)).toEqual({ nombre: 5, toutVoir: true })
  })

  it('les « — » sont égaux entre eux (R1-Q2) : la règle du groupe s’applique à eux aussi', () => {
    // Les « — » ferment toujours la marche : deux à cheval sur la coupure, et
    // rien derrière, tiennent dans N + 1…
    expect(couper([9, 8, 7, 6, null, null], 5)).toEqual({ nombre: 6, toutVoir: false })
    // … trois ou plus forment un groupe : coupe net à N.
    expect(couper([9, 8, 7, 6, null, null, null], 5)).toEqual({ nombre: 5, toutVoir: true })
    // Une valeur puis des « — » : pas d'égalité à la coupure.
    expect(couper([9, 8, 7, 6, 5, null, null], 5)).toEqual({ nombre: 5, toutVoir: true })
  })

  it('jamais plus de N + 1 lignes visibles', () => {
    const tous = Array.from({ length: 12 }, () => 4)
    expect(couper(tous, 5).nombre).toBe(5)
    expect(couper([1, 1, 0, 0, 0, 0], 1).nombre).toBeLessThanOrEqual(2)
  })

  it('41,4 % et 40,6 % sont ex aequo à la coupure, comme à l’écran', () => {
    const lignes = classerPodium(
      [
        ...[90, 80, 70, 60].map((p, i) =>
          carriere(`h${i}`, { doubleAttempts: 10, checkoutPercent: p }),
        ),
        carriere('a', { doubleAttempts: 10, checkoutPercent: 41.4 }),
        carriere('b', { doubleAttempts: 10, checkoutPercent: 40.6 }),
        carriere('c', { doubleAttempts: 10, checkoutPercent: 10 }),
      ],
      MESURE_FINITIONS.DOUBLES,
    )
    const { visibles, toutVoir } = apercuPodium(lignes, 5, (l) => l.valeur)
    expect(visibles.map((l) => l.joueur.playerId)).toEqual(['h0', 'h1', 'h2', 'h3', 'a', 'b'])
    expect(toutVoir).toBe(true)
  })

  it('rend les objets de `classerPodium` intacts : teinte et largeur identiques carte / modal', () => {
    const lignes = classerPodium(
      Array.from({ length: 8 }, (_, i) => carriere(`j${i}`, { average3: 80 - i })),
      MESURE_MOYENNE.MOYENNE,
    )
    const { visibles } = apercuPodium(lignes, APERCU_PODIUM.MOYENNE, (l) => l.valeur)
    visibles.forEach((ligne, rang) => {
      expect(ligne).toBe(lignes[rang])
    })
  })

  it('les quatre cartes : 5, 5, 3, 5', () => {
    expect(APERCU_PODIUM).toEqual({ MOYENNE: 5, VICTOIRES: 5, GROSSES_VOLEES: 3, FINITIONS: 5 })
  })
})

describe('MESURE_GROSSES_VOLEES — classer sur un seuil (Révision 1)', () => {
  it('classe sur le seuil choisi ; zéro est une valeur, pas un « — »', () => {
    const joueurs = [
      carriere('kevin', { count180: 2, count140plus: 3, count100plus: 4 }),
      carriere('sarah', { count180: 0, count140plus: 5, count100plus: 9 }),
      carriere('julien'),
    ]
    const sur = (seuil: '180' | '140+' | '100+') =>
      classerPodium(joueurs, MESURE_GROSSES_VOLEES[seuil])

    expect(ids(sur('180'))).toEqual(['kevin', 'sarah', 'julien'])
    expect(ids(sur('140+'))).toEqual(['sarah', 'kevin', 'julien'])
    expect(ids(sur('100+'))).toEqual(['sarah', 'kevin', 'julien'])
    expect(sur('180').map((l) => l.valeur)).toEqual([2, 0, 0])
    expect(sur('180').map((l) => l.texte)).toEqual(['2', '0', '0'])
  })
})

/** Une carrière de test : tout à zéro, sauf ce qu'on précise. */
const carriere = (id: string, champs: Partial<PlayerCareer> = {}): PlayerCareer => ({
  playerId: id as PlayerId,
  name: id,
  color: 'brique',
  matchesPlayed: 1,
  matchesWon: 0,
  matchWinPercent: 0,
  legsWon: 0,
  legsPlayed: 0,
  legWinPercent: 0,
  visits: 1,
  dartsThrown: 3,
  pointsScored: 0,
  average3: 0,
  first9Average: 0,
  count180: 0,
  count140plus: 0,
  count100plus: 0,
  count60plus: 0,
  doubleAttempts: 0,
  doublesHit: 0,
  checkoutPercent: 0,
  bestLegDarts: null,
  highestCheckout: 0,
  highestVisit: 0,
  hits: DartboardHits.empty(),
  ...champs,
})

const ids = (lignes: readonly { readonly joueur: PlayerCareer }[]) =>
  lignes.map((ligne) => ligne.joueur.playerId)

describe('classerPodium — le classement d’une carte', () => {
  it('classe en décroissant : le plus grand en tête, barre pleine pour lui', () => {
    const lignes = classerPodium(
      [
        carriere('julien', { average3: 47.3 }),
        carriere('kevin', { average3: 64.2 }),
        carriere('sarah', { average3: 58.7 }),
      ],
      MESURE_MOYENNE.MOYENNE,
    )

    expect(ids(lignes)).toEqual(['kevin', 'sarah', 'julien'])
    expect(lignes.map((l) => l.texte)).toEqual(['64,2', '58,7', '47,3'])
    expect(lignes[0]?.largeur).toBe(1)
    expect(lignes[1]?.largeur).toBeCloseTo(58.7 / 64.2)
    expect(lignes.map((l) => l.enTete)).toEqual([true, false, false])
  })

  it('classe la manche en croissant : la plus courte en tête, largeur = min ÷ valeur', () => {
    const lignes = classerPodium(
      [
        carriere('kevin', { bestLegDarts: 15 }),
        carriere('julien', { bestLegDarts: 21 }),
        carriere('sarah', { bestLegDarts: 17 }),
      ],
      MESURE_FINITIONS.MANCHE,
    )

    expect(ids(lignes)).toEqual(['kevin', 'sarah', 'julien'])
    expect(lignes[0]?.largeur).toBe(1)
    expect(lignes[2]?.largeur).toBeCloseTo(15 / 21)
    expect(lignes[0]?.enTete).toBe(true)
  })

  it('met les joueurs sans occasion en dernier, « — », barre vide, jamais en tête', () => {
    const lignes = classerPodium(
      [
        carriere('david'),
        carriere('julien', { doubleAttempts: 3, doublesHit: 0, checkoutPercent: 0 }),
        carriere('kevin', { doubleAttempts: 3, doublesHit: 1, checkoutPercent: 100 / 3 }),
      ],
      MESURE_FINITIONS.DOUBLES,
    )

    expect(ids(lignes)).toEqual(['kevin', 'julien', 'david'])
    expect(lignes.map((l) => l.texte)).toEqual(['33 %', '0 %', '—'])
    expect(lignes[2]).toMatchObject({ valeur: null, largeur: 0, enTete: false })
  })

  it('« Plus haut » à 0 et manche absente valent « — » et ferment la marche', () => {
    const plusHaut = classerPodium(
      [carriere('a'), carriere('b', { highestCheckout: 121 })],
      MESURE_FINITIONS.PLUS_HAUT,
    )
    expect(ids(plusHaut)).toEqual(['b', 'a'])
    expect(plusHaut[1]?.texte).toBe('—')

    const manche = classerPodium(
      [carriere('a'), carriere('b', { bestLegDarts: 18 })],
      MESURE_FINITIONS.MANCHE,
    )
    expect(ids(manche)).toEqual(['b', 'a'])
    expect(manche[1]?.texte).toBe('—')
  })

  it('ne produit jamais de NaN, même tout à zéro ou sans aucune occasion', () => {
    const mesures: readonly MesurePodium[] = [
      ...Object.values(MESURE_MOYENNE),
      MESURE_VICTOIRES,
      ...Object.values(MESURE_FINITIONS),
    ]
    for (const mesure of mesures) {
      const lignes = classerPodium([carriere('a'), carriere('b')], mesure)
      for (const ligne of lignes) {
        expect(Number.isNaN(ligne.largeur)).toBe(false)
        expect(ligne.largeur).toBeGreaterThanOrEqual(0)
        expect(ligne.largeur).toBeLessThanOrEqual(1)
      }
    }
  })

  it('tous à égalité à une valeur non nulle : tous en tête (tous à 180 → tous dorés)', () => {
    const lignes = classerPodium(
      [carriere('a', { highestVisit: 180 }), carriere('b', { highestVisit: 180 })],
      MESURE_MOYENNE.VOLEE,
    )
    expect(lignes.map((l) => l.enTete)).toEqual([true, true])
  })

  it('un seul joueur : sa barre est dorée, sauf à zéro', () => {
    expect(
      classerPodium([carriere('a', { average3: 42 })], MESURE_MOYENNE.MOYENNE)[0]?.enTete,
    ).toBe(true)
    expect(classerPodium([carriere('a')], MESURE_VICTOIRES)[0]?.enTete).toBe(false)
  })

  it('jamais de dorure à zéro : un « 0 % » devant des « — » n’est pas doré (Q1)', () => {
    const lignes = classerPodium(
      [carriere('a'), carriere('b', { doubleAttempts: 3, checkoutPercent: 0 }), carriere('c')],
      MESURE_FINITIONS.DOUBLES,
    )
    expect(ids(lignes)).toEqual(['b', 'a', 'c'])
    expect(lignes.map((l) => l.texte)).toEqual(['0 %', '—', '—'])
    expect(lignes.map((l) => l.enTete)).toEqual([false, false, false])
  })

  it('les sans occasion ne comptent pas : un meilleur non nul reste doré devant eux', () => {
    const lignes = classerPodium(
      [carriere('a'), carriere('b', { doubleAttempts: 3, checkoutPercent: 100 / 3 })],
      MESURE_FINITIONS.DOUBLES,
    )
    expect(lignes.map((l) => l.enTete)).toEqual([true, false])
  })

  it('tous à égalité à zéro : aucune teinte (0 victoire chacun)', () => {
    const lignes = classerPodium([carriere('a'), carriere('b'), carriere('c')], MESURE_VICTOIRES)
    expect(lignes.map((l) => l.enTete)).toEqual([false, false, false])
  })

  it('personne n’a d’occasion : le premier garde la grande ligne, sans teinte (U8a)', () => {
    const lignes = classerPodium([carriere('a'), carriere('b')], MESURE_FINITIONS.DOUBLES)
    expect(ids(lignes)).toEqual(['a', 'b'])
    expect(lignes.every((l) => l.valeur === null && !l.enTete)).toBe(true)
  })

  it('ex aequo en tête : l’ordre reçu départage, tous les ex aequo en laiton', () => {
    const lignes = classerPodium(
      [
        carriere('kevin', { matchesWon: 3 }),
        carriere('julien', { matchesWon: 1 }),
        carriere('sarah', { matchesWon: 3 }),
      ],
      MESURE_VICTOIRES,
    )

    // Kevin vient avant Sarah dans l'ordre de `GetPlayerStats` : il garde la grande ligne.
    expect(ids(lignes)).toEqual(['kevin', 'sarah', 'julien'])
    expect(lignes.map((l) => l.enTete)).toEqual([true, true, false])
  })

  it('ex aequo jugé sur le chiffre affiché : 40,6 % et 41,4 % font deux « 41 % » (U5)', () => {
    const lignes = classerPodium(
      [
        carriere('sarah', { doubleAttempts: 10, checkoutPercent: 40.6 }),
        carriere('kevin', { doubleAttempts: 10, checkoutPercent: 41.4 }),
        carriere('julien', { doubleAttempts: 10, checkoutPercent: 24 }),
      ],
      MESURE_FINITIONS.DOUBLES,
    )

    // Égaux à l'écran : l'ordre reçu est conservé, et les deux sont en tête.
    expect(ids(lignes)).toEqual(['sarah', 'kevin', 'julien'])
    expect(lignes.map((l) => l.texte)).toEqual(['41 %', '41 %', '24 %'])
    expect(lignes.map((l) => l.enTete)).toEqual([true, true, false])
    expect(lignes[0]?.largeur).toBe(lignes[1]?.largeur)
  })

  it('les moyennes à une décimale : 64,24 et 64,16 sont deux « 64,2 »', () => {
    const lignes = classerPodium(
      [carriere('a', { average3: 64.16 }), carriere('b', { average3: 64.24 }), carriere('c')],
      MESURE_MOYENNE.MOYENNE,
    )
    expect(ids(lignes)).toEqual(['a', 'b', 'c'])
    expect(lignes.map((l) => l.enTete)).toEqual([true, true, false])
  })

  it('First 9 et Meilleure volée reclassent la même carte', () => {
    const joueurs = [
      carriere('kevin', { average3: 64.2, first9Average: 60, highestVisit: 140 }),
      carriere('sarah', { average3: 58.7, first9Average: 66, highestVisit: 180 }),
    ]
    expect(ids(classerPodium(joueurs, MESURE_MOYENNE.MOYENNE))).toEqual(['kevin', 'sarah'])
    expect(ids(classerPodium(joueurs, MESURE_MOYENNE.FIRST_9))).toEqual(['sarah', 'kevin'])
    expect(ids(classerPodium(joueurs, MESURE_MOYENNE.VOLEE))).toEqual(['sarah', 'kevin'])
  })
})

describe('decompteBatons — le plafond des bâtons', () => {
  it.each([
    [0, 0, 0],
    [4, 0, 4],
    [5, 1, 0],
    [49, 9, 4],
    [50, 10, 0],
    [51, 10, 0],
    [312, 10, 0],
  ])('%i → %i groupes + %i', (n, groupes, reste) => {
    expect(decompteBatons(n)).toEqual({ groupes, reste })
  })

  it('le plafond est de 10 groupes, soit 50 bâtons', () => {
    expect(PLAFOND_GROUPES_BATONS).toBe(10)
  })
})

describe('joueurDeLaCible — le joueur montré par la cible', () => {
  const kevin = carriere('kevin')
  const sarah = carriere('sarah')
  const muet = carriere('muet', { dartsThrown: 0 })
  const supprime = carriere('parti', { name: null })
  const joueurs = [kevin, sarah, muet, supprime]

  it('montre le joueur mémorisé', () => {
    expect(joueurDeLaCible(joueurs, 'ALL_TIME', 'sarah', null)).toBe(sarah)
  })

  it('retombe sur le premier de la moyenne si le mémorisé est absent de la période', () => {
    expect(joueurDeLaCible(joueurs, 'ALL_TIME', 'absent', null)).toBe(kevin)
  })

  it('retombe sur le premier si le mémorisé n’a aucune fléchette', () => {
    expect(joueurDeLaCible(joueurs, 'ALL_TIME', 'muet', null)).toBe(kevin)
  })

  it('retombe sur le premier si le profil mémorisé a été supprimé', () => {
    expect(joueurDeLaCible(joueurs, 'ALL_TIME', 'parti', null)).toBe(kevin)
  })

  it('ignore une valeur corrompue', () => {
    for (const corrompue of [42, null, undefined, { id: 'sarah' }, ['sarah']]) {
      expect(joueurDeLaCible(joueurs, 'ALL_TIME', corrompue, null)).toBe(kevin)
    }
  })

  it('le joueur touché pendant la visite l’emporte, même sans fléchette ou supprimé', () => {
    expect(
      joueurDeLaCible(joueurs, 'ALL_TIME', 'sarah', {
        periode: 'ALL_TIME',
        id: 'muet' as PlayerId,
      }),
    ).toBe(muet)
    expect(
      joueurDeLaCible(joueurs, 'ALL_TIME', null, { periode: 'ALL_TIME', id: 'parti' as PlayerId }),
    ).toBe(supprime)
  })

  it('un choix fait sur une autre période ne vaut plus : la règle de repli reprend', () => {
    expect(
      joueurDeLaCible(joueurs, 'TODAY', 'sarah', { periode: 'ALL_TIME', id: 'muet' as PlayerId }),
    ).toBe(sarah)
  })

  it('liste vide : personne', () => {
    expect(joueurDeLaCible([], 'ALL_TIME', 'sarah', null)).toBeUndefined()
  })
})

describe('defilementPourMontrer — l’onglet actif ramené dans le ruban (constat 3)', () => {
  const ruban = { defilement: 100, largeur: 300 }

  it('déjà visible : rien à faire', () => {
    expect(defilementPourMontrer({ debut: 150, fin: 250, ...ruban })).toBeNull()
    expect(defilementPourMontrer({ debut: 100, fin: 400, ...ruban })).toBeNull()
  })

  it('dépasse à droite : on aligne son bord droit', () => {
    expect(defilementPourMontrer({ debut: 600, fin: 700, ...ruban })).toBe(400)
  })

  it('dépasse à gauche : on aligne son bord gauche', () => {
    expect(defilementPourMontrer({ debut: 20, fin: 120, ...ruban })).toBe(20)
  })

  it('plus large que le ruban : son début reste visible', () => {
    expect(defilementPourMontrer({ debut: 500, fin: 900, ...ruban })).toBe(500)
  })
})
