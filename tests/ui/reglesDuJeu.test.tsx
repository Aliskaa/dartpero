import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { CricketRules } from '@/core/domain/games/cricket/rules'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { TourDuMondeRules } from '@/core/domain/games/tour-du-monde/rules'
import { X01Config } from '@/core/domain/games/x01/config'
import { checkoutRange } from '@/core/domain/services/checkout'
import { resolveVisit } from '@/core/domain/services/visitOutcome'
import { Dart, type Segment as SegmentDart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import {
  type BlocRegles,
  type ContenuRegles,
  LIBELLE_PAS_DE_FINISH,
  type Segment,
  TITRE_REGLES,
} from '@/ui/labels'
import { contenuRegles, type ReglesDeLaPartie } from '@/ui/reglesDuJeu'
import { fakeServices } from '../fakes'
import { lancer } from '../use-cases/lancerPartie'
import { avancerTelephone, flechette, locationCourante, retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

const SORTIES = {
  surUnDouble: checkoutRange({ doubleOut: true }),
  libre: checkoutRange({ doubleOut: false }),
}

const X01_PLANCHE: ReglesDeLaPartie = {
  mode: 'X01',
  score: 501,
  legs: 2,
  sets: 1,
  doubleOut: false,
  doubleIn: false,
}

const texteDe = (segments: readonly Segment[]): string =>
  segments.map((segment) => (typeof segment === 'string' ? segment : segment.fort)).join('')

const rubrique = (contenu: ContenuRegles, titre: string): readonly BlocRegles[] => {
  const trouvee = contenu.rubriques.find((r) => r.titre === titre)
  if (!trouvee) throw new Error(`rubrique ${titre} absente`)
  return trouvee.blocs
}

/** Les lignes d'une rubrique en liste : `[texte, gris ?]`. */
const lignes = (contenu: ContenuRegles, titre: string): (readonly [string, boolean])[] =>
  rubrique(contenu, titre).flatMap((bloc) =>
    bloc.type === 'liste'
      ? bloc.lignes.map((ligne) => [texteDe(ligne.segments), ligne.autre === true] as const)
      : [],
  )

const texteBloc = (bloc: BlocRegles): string => {
  switch (bloc.type) {
    case 'liste':
      return bloc.lignes.map((ligne) => texteDe(ligne.segments)).join('\n')
    case 'paragraphe':
      return texteDe(bloc.segments)
    case 'pastilles':
      return bloc.nombres.join(' ')
    case 'exemple':
      return [
        bloc.colonnes.join(' '),
        ...bloc.lignes.map((l) => l.map((c) => texteDe(c.segments)).join(' ')),
      ].join('\n')
    case 'questions':
      return bloc.questions.map((q) => `${q.question}\n${texteDe(q.reponse)}`).join('\n')
    case 'reglages':
      return bloc.reglages
        .map(
          (r) => `${r.terme} ${r.options.map((o) => `${o.libelle}${o.suite ?? ''}`).join(' · ')}`,
        )
        .join('\n')
    case 'parcours':
      return `${bloc.legende} ${bloc.cibles.join(' ')}`
  }
}

/** Tout le texte d'un contenu, pour les recherches de phrases et d'absences. */
const toutLeTexte = (contenu: ContenuRegles): string =>
  [
    contenu.titre,
    contenu.ceSoir,
    texteDe(contenu.enBref),
    ...contenu.rubriques.flatMap((r) => [r.titre, ...r.blocs.map(texteBloc)]),
  ].join('\n')

const auLaiton = (contenu: ContenuRegles): string[] =>
  rubrique(contenu, 'Les réglages possibles').flatMap((bloc) =>
    bloc.type === 'reglages'
      ? bloc.reglages.flatMap((r) => r.options.filter((o) => o.ceSoir).map((o) => o.libelle))
      : [],
  )

describe('Feuille de règles — le texte suit les réglages', () => {
  it('X01 de la planche : « Ce soir » reprend le récapitulatif de la fiche', () => {
    const contenu = contenuRegles(X01_PLANCHE, SORTIES)
    expect(contenu.titre).toBe('Règles du X01')
    expect(contenu.ceSoir).toBe(
      '501 · premier à 2 manches · checkout libre · entrée libre · sans sets',
    )
    expect(texteDe(contenu.enBref)).toBe(
      'Chacun part de 501 et retire ses points. Le premier qui arrive pile à zéro gagne la manche.',
    )
    expect(contenu.rubriques.map((r) => r.titre)).toEqual([
      'Marquer',
      'Gagner',
      'Cas particuliers',
      'Les checkouts',
      'Un exemple',
      'Questions fréquentes',
      'Ce que l’app compte',
      'Les réglages possibles',
    ])
  })

  it('X01 : les trois phrases corrigées d’après le code (Q1)', () => {
    const texte = toutLeTexte(contenuRegles(X01_PLANCHE, SORTIES))
    expect(texte).toContain('Une volée, c’est 3 fléchettes au plus.')
    expect(texte).toContain('Pour la moyenne, oui : les fléchettes lancées comptent, avec 0 point.')
    expect(texte).toContain('la même moyenne, sur les 3 premières volées de chaque manche.')
    expect(texte).not.toContain('trois fléchettes, 0 point')
    expect(texte).not.toContain('9 premières fléchettes')
  })

  it('X01 en checkout libre : checkout libre pleine, sortie et entrée sur un double en gris', () => {
    const cas = lignes(contenuRegles(X01_PLANCHE, SORTIES), 'Cas particuliers')
    expect(cas.find(([t]) => t.startsWith('Checkout libre'))?.[1]).toBe(false)
    expect(cas.find(([t]) => t.startsWith('Checkout sur un double'))?.[1]).toBe(true)
    expect(cas.find(([t]) => t.startsWith('Entrée sur un double'))?.[1]).toBe(true)
  })

  it('X01 sur un double et entrée sur un double : la bascule, même ordre', () => {
    const contenu = contenuRegles({ ...X01_PLANCHE, doubleOut: true, doubleIn: true }, SORTIES)
    expect(contenu.ceSoir).toContain('checkout sur un double · entrée sur un double')
    const cas = lignes(contenu, 'Cas particuliers')
    expect(cas.map(([t]) => t.split(' :')[0])).toEqual([
      'Bust',
      'Checkout libre',
      'Checkout sur un double',
      'Entrée sur un double',
    ])
    expect(cas.map(([, gris]) => gris)).toEqual([false, true, false, false])
    expect(auLaiton(contenu)).toEqual(['501', '2', 'Sans', 'sur un double', 'sur un double'])
  })

  it('X01, « Les checkouts » : la liste de ce soir en rouge, l’autre en gris', () => {
    const pastilles = (doubleOut: boolean) =>
      rubrique(contenuRegles({ ...X01_PLANCHE, doubleOut }, SORTIES), 'Les checkouts').flatMap(
        (bloc) => (bloc.type === 'pastilles' ? [[bloc.nombres, bloc.autre === true] as const] : []),
      )
    expect(pastilles(false)).toEqual([
      [[179, 178, 176, 175, 173, 172, 169, 166, 163], false],
      [[169, 168, 166, 165, 163, 162, 159], true],
    ])
    expect(pastilles(true)).toEqual([
      [[169, 168, 166, 165, 163, 162, 159], false],
      [[179, 178, 176, 175, 173, 172, 169, 166, 163], true],
    ])
    const texte = toutLeTexte(contenuRegles({ ...X01_PLANCHE, doubleOut: true }, SORTIES))
    expect(texte).toContain('dès qu’il reste 170 ou moins')
  })

  it('X01 avec sets : la partie se gagne en sets ; premier à 1 manche : pas de « plus de 1 »', () => {
    const avecSets = lignes(contenuRegles({ ...X01_PLANCHE, sets: 2 }, SORTIES), 'Gagner')
    expect(avecSets[0]?.[0]).toBe(
      'Le premier à 2 manches gagne le set, et le premier à 2 sets gagne la partie.',
    )
    expect(avecSets.at(-1)).toEqual(['Sans sets, la partie se gagne au premier à 2 manches.', true])

    const uneManche = lignes(contenuRegles({ ...X01_PLANCHE, legs: 1 }, SORTIES), 'Gagner')
    expect(uneManche[0]?.[0]).toBe('Le premier à 1 manche gagne la partie.')
    expect(uneManche.some(([t]) => t.startsWith('À 3 ou 4 joueurs'))).toBe(false)

    const troisManches = lignes(contenuRegles({ ...X01_PLANCHE, legs: 3 }, SORTIES), 'Gagner')
    expect(troisManches.some(([t]) => t.endsWith('peut en durer plus de 5.'))).toBe(true)
  })

  /** D10 : une vieille partie hors des listes n'allume aucune valeur. */
  it('ne met en laiton qu’une valeur de la liste', () => {
    const contenu = contenuRegles({ ...X01_PLANCHE, score: 1001, legs: 7 }, SORTIES)
    expect(contenu.ceSoir.startsWith('1001 · premier à 7 manches')).toBe(true)
    expect(auLaiton(contenu)).toEqual(['Sans', 'Libre', 'Libre'])
  })

  it('Cricket : standard de la planche, puis cut-throat en entier et standard en gris', () => {
    const cibles = [20, 19, 18, 17, 16, 15, 'BULL'] as const
    const standard = contenuRegles({ mode: 'CRICKET', variante: 'STANDARD', cibles }, SORTIES)
    expect(standard.ceSoir).toBe('Standard · 7 cibles · 20 à 15 et la bulle')
    expect(lignes(standard, 'Marquer')[0]?.[0]).toBe(
      'Les cibles : 20, 19, 18, 17, 16, 15 et la bulle.',
    )
    expect(lignes(standard, 'Gagner').map(([, gris]) => gris)).toEqual([false, false, true])
    expect(auLaiton(standard)).toEqual(['Standard'])

    const ct = contenuRegles({ mode: 'CRICKET', variante: 'CUT_THROAT', cibles }, SORTIES)
    expect(ct.ceSoir).toBe('Cut-throat · 7 cibles · 20 à 15 et la bulle')
    expect(lignes(ct, 'Gagner').map(([, gris]) => gris)).toEqual([true, false, false])
    expect(auLaiton(ct)).toEqual(['Cut-throat'])
    expect(toutLeTexte(ct)).toContain('+60 pour Julien')

    // DV4 : le +60 est vert en standard (pour soi), rouge en cut-throat (pour l'adversaire).
    const tonDuPlus60 = (contenu: ContenuRegles) =>
      rubrique(contenu, 'Un exemple').flatMap((bloc) =>
        bloc.type === 'exemple' ? [bloc.lignes[0]?.[2]?.ton] : [],
      )
    expect(tonDuPlus60(standard)).toEqual(['ok'])
    expect(tonDuPlus60(ct)).toEqual(['bust'])
  })

  it.each([5, 10, 20])('entraînement à %i sorties', (sorties) => {
    const contenu = contenuRegles(
      { mode: 'CHECKOUT_PRACTICE', sorties, min: 41, max: 170 },
      SORTIES,
    )
    expect(contenu.titre).toBe('Règles de l’entraînement')
    expect(contenu.ceSoir).toBe(`${sorties} checkouts · restes tirés entre 41 et 170`)
    expect(auLaiton(contenu)).toEqual([String(sorties)])
  })

  it('Tour du monde : le parcours en 21 cases dans « Marquer »', () => {
    const cibles = [
      20,
      19,
      18,
      17,
      16,
      15,
      14,
      13,
      12,
      11,
      10,
      9,
      8,
      7,
      6,
      5,
      4,
      3,
      2,
      1,
      'BULL',
    ] as const
    const contenu = contenuRegles({ mode: 'TOUR_DU_MONDE', cibles }, SORTIES)
    expect(contenu.ceSoir).toBe('20 → 1, puis la bulle · 21 cibles · rien à régler')
    const parcours = rubrique(contenu, 'Marquer').find((bloc) => bloc.type === 'parcours')
    expect(parcours?.type === 'parcours' && parcours.cibles).toHaveLength(21)
  })

  it('ni « leg » ni « best of » dans aucune feuille', () => {
    const tous: ReglesDeLaPartie[] = [
      X01_PLANCHE,
      { ...X01_PLANCHE, sets: 3, legs: 4, doubleOut: true, doubleIn: true },
      { mode: 'CRICKET', variante: 'CUT_THROAT', cibles: [20, 'BULL'] },
      { mode: 'TOUR_DU_MONDE', cibles: [20, 'BULL'] },
      { mode: 'CHECKOUT_PRACTICE', sorties: 5, min: 41, max: 170 },
    ]
    for (const regles of tous) {
      const texte = toutLeTexte(contenuRegles(regles, SORTIES))
      expect(texte).toMatch(/manche|cible|checkout/i)
      expect(texte).not.toMatch(/\blegs?\b/i)
      expect(texte).not.toMatch(/best of/i)
    }
  })
})

/** T5 : les exemples de la feuille, rejoués par les vraies règles. */
describe('Feuille de règles — les exemples tiennent aux vraies règles', () => {
  const ouverte = { doubleIn: false } as const

  it('X01 : 40, puis 20, 15, 10 → bust ; une troisième à 5 gagne en checkout libre, pas sur un double', () => {
    const libre = { ...ouverte, doubleOut: false }
    expect(
      resolveVisit(libre, 40, true, [Dart.single(20), Dart.single(15), Dart.single(10)]).outcome,
    ).toBe('BUSTED')
    expect(
      resolveVisit(libre, 40, true, [Dart.single(20), Dart.single(15), Dart.single(5)]).outcome,
    ).toBe('CHECKOUT')
    expect(
      resolveVisit({ ...ouverte, doubleOut: true }, 40, true, [
        Dart.single(20),
        Dart.single(15),
        Dart.single(5),
      ]).outcome,
    ).toBe('BUSTED')
  })

  it('entraînement : 81, T19 puis D12 sort sur un double en deux fléchettes', () => {
    const resolution = resolveVisit({ ...ouverte, doubleOut: true }, 81, true, [
      Dart.triple(19),
      Dart.double(12),
      Dart.single(20),
    ])
    expect(resolution.outcome).toBe('CHECKOUT')
    expect(resolution.dartsUsed).toBe(2)
  })

  it.each([
    ['STANDARD', 60, 0],
    ['CUT_THROAT', 0, 60],
  ] as const)('Cricket %s : T20 sur un 20 fermé, Julien à 1 marque', (variant, kevin, julien) => {
    const k = 'kevin' as PlayerId
    const j = 'julien' as PlayerId
    let etat = CricketRules.start({
      type: 'CricketStarted',
      config: { targets: [20, 19, 18, 17, 16, 15, 'BULL'], variant },
      playerIds: [k, j],
      startingPlayerIndex: 0,
    })
    const miss = Dart.miss()
    etat = CricketRules.applyVisit(etat, [Dart.triple(20), miss, miss]) // Kevin ferme le 20
    etat = CricketRules.applyVisit(etat, [Dart.single(20), miss, miss]) // Julien : 1 marque
    etat = CricketRules.applyVisit(etat, [Dart.triple(20), miss, miss]) // l'exemple
    expect(etat.players.map((p) => p.score)).toEqual([kevin, julien])
    etat = CricketRules.applyVisit(etat, [Dart.double(20), miss, miss]) // Julien ferme
    etat = CricketRules.applyVisit(etat, [Dart.single(20), miss, miss]) // fermé partout
    expect(etat.players.map((p) => p.score)).toEqual([kevin, julien])
  })

  it('Tour du monde : sur le 18, D18 · 3 · T17 valide deux cibles et laisse le 16', () => {
    const s = 'sarah' as PlayerId
    let etat = TourDuMondeRules.start({
      type: 'TourDuMondeStarted',
      config: {
        targets: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'BULL'],
      },
      playerIds: [s],
      startingPlayerIndex: 0,
    })
    etat = TourDuMondeRules.applyVisit(etat, [Dart.single(20), Dart.single(19), Dart.miss()])
    etat = TourDuMondeRules.applyVisit(etat, [Dart.double(18), Dart.single(3), Dart.triple(17)])
    expect(etat.history.at(-1)?.hits).toBe(2)
    const sarah = etat.players[0]
    expect(sarah && TourDuMondeRules.currentTarget(etat, sarah)).toBe(16)
  })
})

/* ------------------------------------------------------------------------ */

const nomJeu: Record<GameModeId, string> = TITRE_REGLES

const unePartie = async (mode: GameModeId) => {
  const { services } = fakeServices()
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const joueurs = mode === 'CHECKOUT_PRACTICE' ? [kevin.id] : [kevin.id, julien.id]
  const matchId = await lancer(services, mode, joueurs)
  return { services, matchId }
}

const partieX01 = async (config: Parameters<typeof X01Config.create>[0] = {}) => {
  const { services } = fakeServices()
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create(config),
  })
  return { services, matchId }
}

const ouvrirMatch = (services: Services, matchId: MatchId, historique?: readonly string[]) =>
  renderWithServices(<App />, {
    services,
    historique: historique ?? [`/partie/${matchId}`],
  })

const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)

describe('Le livre ouvert, sur le match', () => {
  it.each(GAME_MODE_IDS)('ouvre la feuille de règles de %s sans changer d’URL', async (mode) => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await unePartie(mode)
    ouvrirMatch(services, matchId)

    const livre = await screen.findByRole('button', { name: nomJeu[mode] })
    expect(livre).toHaveAttribute('aria-haspopup', 'dialog')
    expect(livre).toHaveAttribute('aria-expanded', 'false')

    await utilisateur.click(livre)
    expect(screen.getByRole('dialog', { name: nomJeu[mode] })).toBeInTheDocument()
    expect(livre).toHaveAttribute('aria-expanded', 'true')
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(locationCourante().search).toBe('')
  })

  it('garde la volée en cours, après la croix comme après le retour', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('501'))
    const livre = screen.getByRole('button', { name: 'Règles du X01' })

    await flechette(utilisateur, '20')
    await utilisateur.click(livre)
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('481')

    await flechette(utilisateur, '20')
    await utilisateur.click(livre)
    await retourTelephone()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(scoreDe('Kevin')).toHaveTextContent('461')
    expect(screen.getByRole('button', { name: 'Annuler S20 de Kevin' })).toBeEnabled()
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
  })

  it('le retour ferme la feuille sans quitter l’écran ; le second quitte', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    await utilisateur.click(await screen.findByRole('button', { name: 'Règles du X01' }))

    await retourTelephone()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('après la croix, un seul retour quitte l’écran : pas de retour fantôme', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    await utilisateur.click(await screen.findByRole('button', { name: 'Règles du X01' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  /** T2 : Échap, ou le retour Android capté par le navigateur (CloseWatcher). */
  it('une fermeture native dépile l’entrée, une seule fois', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    await utilisateur.click(await screen.findByRole('button', { name: 'Règles du X01' }))
    const feuille = screen.getByRole('dialog') as HTMLDialogElement

    act(() => feuille.close())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('rend le focus : « Fermer » à l’ouverture, le livre à la fermeture', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const livre = await screen.findByRole('button', { name: 'Règles du X01' })

    await utilisateur.click(livre)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()

    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(livre).toHaveFocus())
  })

  it('replie toutes les rubriques à chaque ouverture ; plusieurs s’ouvrent à la fois', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const livre = await screen.findByRole('button', { name: 'Règles du X01' })

    await utilisateur.click(livre)
    let feuille = screen.getByRole('dialog')
    const replies = within(feuille).getAllByRole('button', { expanded: false })
    expect(replies.map((b) => b.textContent)).toEqual([
      '2Marquer',
      '3Gagner',
      '4Cas particuliers',
      '5Les checkouts',
      '6Un exemple',
      '7Questions fréquentes',
      '8Ce que l’app compte',
      '9Les réglages possibles',
    ])
    await utilisateur.click(within(feuille).getByRole('button', { name: /Marquer/ }))
    await utilisateur.click(within(feuille).getByRole('button', { name: /Les checkouts/ }))
    expect(within(feuille).getByRole('button', { name: /Marquer/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(feuille).getByRole('button', { name: /Les checkouts/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(feuille).getByText('179')).toBeVisible()

    await utilisateur.click(within(feuille).getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await utilisateur.click(livre)
    feuille = screen.getByRole('dialog')
    expect(within(feuille).queryAllByRole('button', { expanded: true })).toEqual([])
  })
})

describe('Le livre ouvert, à l’étape 2', () => {
  it('« Ce soir » suit la sortie choisie, au rouvrir', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    const livre = await screen.findByRole('button', { name: 'Règles du X01' })

    await utilisateur.click(livre)
    expect(
      within(screen.getByRole('dialog')).getByText(/checkout libre · entrée libre/),
    ).toBeVisible()
    await utilisateur.click(screen.getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await utilisateur.click(screen.getByRole('button', { name: /plus de réglages/i }))
    const sortie = within(screen.getByRole('group', { name: 'Checkout' }))
    await utilisateur.click(sortie.getByRole('button', { name: 'Checkout sur un double' }))
    await utilisateur.click(livre)
    expect(
      within(screen.getByRole('dialog')).getByText(/checkout sur un double · entrée libre/),
    ).toBeVisible()
    expect(locationCourante().pathname).toBe('/nouvelle-partie/x01')
  })
})

describe('« Pas de finish » suit la sortie de la partie', () => {
  it.each([172, 173, 175, 176, 178, 179])('checkout libre : pas de finish à %i', async (reste) => {
    const { services, matchId } = await partieX01({ startingScore: reste, doubleOut: false })
    ouvrirMatch(services, matchId)
    expect(await screen.findByText(LIBELLE_PAS_DE_FINISH)).toBeInTheDocument()
  })

  it.each([174, 177, 180])('checkout libre : une route à %i', async (reste) => {
    const { services, matchId } = await partieX01({ startingScore: reste, doubleOut: false })
    ouvrirMatch(services, matchId)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent(String(reste)))
    expect(await screen.findByText('Checkout')).toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_PAS_DE_FINISH)).toBeNull()
  })

  it.each([171, 172, 179])('sur un double : rien au-dessus de 170 (%i)', async (reste) => {
    const { services, matchId } = await partieX01({ startingScore: reste, doubleOut: true })
    ouvrirMatch(services, matchId)
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent(String(reste)))
    expect(screen.queryByText(LIBELLE_PAS_DE_FINISH)).toBeNull()
    expect(screen.queryByText('Checkout')).toBeNull()
  })
})

/* ------------------------------------------------------------------------
 * Boucle Test → Dev, tour 1 : constats C1 à C5 de 03-plan-de-test.md.
 * ---------------------------------------------------------------------- */

const feuilleOuverte = () => screen.getByRole('dialog')
const ceSoir = () => within(feuilleOuverte()).getByText('Ce soir').nextElementSibling?.textContent

const ouvrirLivre = async (utilisateur: ReturnType<typeof userEvent.setup>) => {
  await utilisateur.click(await screen.findByRole('button', { name: /^Règles d/ }))
  return feuilleOuverte()
}

const fermerParLaCroix = async (utilisateur: ReturnType<typeof userEvent.setup>) => {
  await utilisateur.click(within(feuilleOuverte()).getByRole('button', { name: 'Fermer' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}

const deplier = (utilisateur: ReturnType<typeof userEvent.setup>, rubriqueNom: RegExp) =>
  utilisateur.click(within(feuilleOuverte()).getByRole('button', { name: rubriqueNom }))

describe('C1 — la feuille se referme sur chaque entrée d’historique', () => {
  it('retour, suivant, puis croix : la feuille se referme encore', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])

    await ouvrirLivre(utilisateur)
    await fermerParLaCroix(utilisateur)

    await avancerTelephone() // revient sur l'entrée `regles`
    expect(feuilleOuverte()).toBeInTheDocument()
    await fermerParLaCroix(utilisateur)
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(screen.getByRole('button', { name: 'Règles du X01' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('retour, suivant, puis fermeture native : rien ne reste ouvert', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])

    await ouvrirLivre(utilisateur)
    await fermerParLaCroix(utilisateur)
    await avancerTelephone()
    act(() => (feuilleOuverte() as HTMLDialogElement).close())
    // Le `<dialog>` reste monté (même discipline que la `Modale`) : fermé et vide.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.querySelector('dialog[open]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Règles du X01' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })
})

describe('C2 — « Ce soir » lit la configuration de la partie', () => {
  it('Cricket cut-throat', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const k = await services.managePlayers.create('Kevin')
    const j = await services.managePlayers.create('Julien')
    const matchId = await services.playCricket.start({
      playerIds: [k.id, j.id],
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
    })
    ouvrirMatch(services, matchId)
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('Cut-throat · 7 cibles · 20 à 15 et la bulle')
  })

  it('Tour du monde', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await unePartie('TOUR_DU_MONDE')
    ouvrirMatch(services, matchId)
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('20 → 1, puis la bulle · 21 cibles · rien à régler')
  })

  it('entraînement de 5 checkouts', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const k = await services.managePlayers.create('Kevin')
    const matchId = await services.playCheckoutPractice.start({
      playerId: k.id,
      config: CheckoutPracticeConfig.create({ rounds: 5 }),
    })
    ouvrirMatch(services, matchId)
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('5 checkouts · restes tirés entre 41 et 170')
  })

  it('X01 : la sortie et l’entrée ne se confondent pas', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01({ doubleOut: false, doubleIn: true })
    ouvrirMatch(services, matchId)
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe(
      '501 · premier à 2 manches · checkout libre · entrée sur un double · sans sets',
    )
  })

  it('étape 2 du Cricket : changer le comptage puis rouvrir change « Ce soir »', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/cricket' })
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('Standard · 7 cibles · 20 à 15 et la bulle')
    await fermerParLaCroix(utilisateur)

    await utilisateur.click(screen.getByRole('button', { name: /^Cut-throat/ }))
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('Cut-throat · 7 cibles · 20 à 15 et la bulle')
  })

  it('étape 2 de l’entraînement : changer le nombre de checkouts puis rouvrir', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/entrainement' })
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('10 checkouts · restes tirés entre 41 et 170')
    await fermerParLaCroix(utilisateur)

    const rail = within(screen.getByRole('group', { name: 'Nombre de checkouts' }))
    await utilisateur.click(rail.getByRole('button', { name: '20' }))
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe('20 checkouts · restes tirés entre 41 et 170')
  })

  it('étape 2 du X01 : l’entrée sur un double seule ne touche pas la sortie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    await screen.findByRole('button', { name: 'Règles du X01' })
    await utilisateur.click(screen.getByRole('button', { name: /plus de réglages/i }))
    const entree = within(screen.getByRole('group', { name: 'Entrée' }))
    await utilisateur.click(entree.getByRole('button', { name: 'Sur un double' }))
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toContain('checkout libre · entrée sur un double')
  })
})

describe('C3 — les couleurs de rôle, dans le DOM', () => {
  it('X01 sur un double : ligne grise, valeur de ce soir en laiton, bust en rouge', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01({ doubleOut: true })
    ouvrirMatch(services, matchId)
    const feuille = await ouvrirLivre(utilisateur)
    await deplier(utilisateur, /Cas particuliers/)
    await deplier(utilisateur, /Un exemple/)
    await deplier(utilisateur, /Les réglages possibles/)

    const ligne = (debut: string) =>
      within(feuille)
        .getAllByRole('listitem')
        .find((li) => li.textContent?.startsWith(debut))
    expect(ligne('Checkout libre')).toHaveClass('text-craie-3-regles')
    expect(ligne('Checkout sur un double')).not.toHaveClass('text-craie-3-regles')

    const reglage = (terme: string) => within(feuille).getByText(terme).nextElementSibling
    const allumes = [...(reglage('Départ')?.querySelectorAll('.text-laiton-clair') ?? [])]
    expect(allumes.map((e) => e.textContent)).toEqual(['501'])

    expect(
      within(feuille)
        .getByText(/Sous zéro/)
        .closest('td'),
    ).toHaveClass('text-rouge-texte')
  })

  it('Cricket standard : le succès de l’exemple en vert', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await unePartie('CRICKET')
    ouvrirMatch(services, matchId)
    const feuille = await ouvrirLivre(utilisateur)
    await deplier(utilisateur, /Un exemple/)
    expect(
      within(feuille)
        .getByText(/marques en trop/)
        .closest('td'),
    ).toHaveClass('text-vert-texte')
  })
})

describe('C4 — le retour à l’étape 2', () => {
  it('le premier retour ferme la feuille, le second ramène à l’étape 1', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, {
      services,
      historique: ['/nouvelle-partie', '/nouvelle-partie/x01'],
    })
    await ouvrirLivre(utilisateur)

    await retourTelephone()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(locationCourante().pathname).toBe('/nouvelle-partie/x01')

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/nouvelle-partie')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Nouvelle partie')
  })
})

/**
 * C5 — le texte de la planche `regles-rubriques.html` (objet `JEUX`), balises
 * retirées, recopié ici mot pour mot. Seules différences : les trois phrases X01
 * corrigées d'après le code (Q1), marquées « Q1 ».
 */
describe('C5 — le texte de la planche, mot pour mot', () => {
  it('X01 : 501, premier à 2, checkout libre, entrée libre, sans sets', () => {
    expect(toutLeTexte(contenuRegles(X01_PLANCHE, SORTIES)).split('\n')).toEqual([
      'Règles du X01',
      '501 · premier à 2 manches · checkout libre · entrée libre · sans sets',
      'Chacun part de 501 et retire ses points. Le premier qui arrive pile à zéro gagne la manche.',
      'Marquer',
      'Une volée, c’est 3 fléchettes au plus.', // Q1 (c)
      'Simple, double ou triple du secteur touché. La bulle vaut 25, le centre 50.',
      'Pas de triple sur la bulle. Une fléchette hors cible vaut 0.',
      'Gagner',
      'Le premier à 2 manches gagne la partie.',
      'Celui qui commence change à chaque manche.',
      'À 3 ou 4 joueurs, on joue jusqu’à ce que quelqu’un ait gagné 2 manches : la partie peut en durer plus de 3.',
      'Avec des sets, un set se gagne au premier à N manches, et la partie au premier à S sets.',
      'Cas particuliers',
      'Bust : si la volée fait passer sous zéro, elle est annulée et le score revient à sa valeur d’avant la volée. C’est au suivant.',
      'Checkout libre : n’importe quelle fléchette qui amène pile à zéro gagne.',
      'Checkout sur un double : il faut finir sur un double (le centre à 50 compte). Un reste de 1, ou un zéro sans double, est aussi un bust.',
      'Entrée sur un double : le score ne décompte qu’à partir du premier double.',
      'Les checkouts',
      'Ce soir, l’app propose un checkout dès qu’il reste 180 ou moins. Ces restes n’ont pas de checkout en 3 fléchettes, l’app affiche « Pas de finish » :',
      '179 178 176 175 173 172 169 166 163',
      'Checkout sur un double : 170 au plus (T20 · T20 · centre), et pas de checkout pour :',
      '169 168 166 165 163 162 159',
      'Un exemple',
      'Il reste 40 à Kevin.',
      'Fléchette Touche Reste',
      '1 20 20',
      '2 15 5',
      '3 10 Sous zéro : bust, retour à 40',
      'Kevin repart de 40 à sa prochaine volée. Avec une troisième fléchette à 5, il aurait gagné la manche.',
      'Questions fréquentes',
      'Les fléchettes d’un bust comptent-elles ?',
      'Pour le score, non : toute la volée est annulée. Pour la moyenne, oui : les fléchettes lancées comptent, avec 0 point.', // Q1 (a)
      'Peut-on finir sur la bulle ?',
      'Oui. En checkout sur un double, seul le centre à 50 finit : il compte comme un double.',
      'Pourquoi l’app ne propose rien à 169 ?',
      'Aucune volée de 3 fléchettes ne fait 169 avec les règles de ce soir. Plutôt qu’une suggestion fausse, l’app affiche « Pas de finish ».',
      'Le checkout proposé est-il celui des pros ?',
      'C’est toujours une route qui marche, mais elle peut différer des tables professionnelles.',
      'Qui commence la manche suivante ?',
      'Le joueur suivant dans l’ordre : celui qui commence change à chaque manche.',
      'Ce que l’app compte',
      'Moyenne 3 fléchettes : points marqués ÷ fléchettes lancées × 3. Un bust marque 0 point, mais ses fléchettes comptent.',
      'First 9 : la même moyenne, sur les 3 premières volées de chaque manche.', // Q1 (b)
      '% doubles : doubles de checkout réussis ÷ tentatives. Compté seulement en checkout sur un double.',
      'Grosses volées : 180, 140 et plus, 100 et plus, 60 et plus.',
      'Meilleure manche : le moins de fléchettes pour finir une manche. Plus haut checkout : la plus grosse volée qui a fini une manche.',
      'Les réglages possibles',
      'Départ 301 · 501 · 701',
      'Manches Premier à 1 · 2 · 3 · 4',
      'Sets Sans · premier à 2 · 3',
      'Checkout Libre · sur un double',
      'Entrée Libre · sur un double',
      'Ce soir en laiton. Les réglages se choisissent à l’étape 2 et ne changent plus en cours de partie.',
    ])
  })

  it('Cricket standard', () => {
    const contenu = contenuRegles(
      { mode: 'CRICKET', variante: 'STANDARD', cibles: [20, 19, 18, 17, 16, 15, 'BULL'] },
      SORTIES,
    )
    expect(toutLeTexte(contenu).split('\n')).toEqual([
      'Règles du Cricket',
      'Standard · 7 cibles · 20 à 15 et la bulle',
      'Fermez les sept cibles avant les autres, sans être derrière au score.',
      'Marquer',
      'Les cibles : 20, 19, 18, 17, 16, 15 et la bulle.',
      'Simple = 1 marque, double = 2, triple = 3. La bulle à 25 vaut 1 marque, le centre à 50 en vaut 2.',
      'Trois marques ferment une cible. Elles peuvent venir de plusieurs volées.',
      'Au-delà, chaque marque rapporte la valeur de la cible (25 pour la bulle), seulement si un adversaire au moins ne l’a pas fermée.',
      'Une fléchette hors des sept cibles ne vaut rien.',
      'Gagner',
      'Gagne le premier qui a tout fermé avec un score au moins égal à celui de chaque adversaire.',
      'Une seule partie, sans manches. Dès qu’un joueur gagne, la partie s’arrête : on ne finit pas le tour de table.',
      'En cut-throat, les points vont aux adversaires qui n’ont pas fermé la cible, et le plus petit score gagne.',
      'Cas particuliers',
      'Une cible fermée par tout le monde ne rapporte plus rien.',
      'Pas de bust : une volée ne fait jamais reculer. Elle fait toujours 3 fléchettes, sauf celle qui gagne.',
      'Un exemple',
      'À deux joueurs. Kevin a fermé le 20, Julien a 1 marque dessus.',
      'Qui Touche Effet',
      'Kevin T20 3 marques en trop : +60 pour Kevin',
      'Julien D20 1 + 2 = 3 marques : Julien ferme le 20',
      'Kevin 20 Le 20 est fermé partout : 0 point',
      'Questions fréquentes',
      'Une fléchette peut-elle fermer et marquer ?',
      'Oui. Avec 2 marques sur le 19, un triple 19 ferme (1 marque) et les 2 autres rapportent 38 points, si un adversaire n’a pas fermé le 19.',
      'J’ai tout fermé mais je suis mené : j’ai gagné ?',
      'Non. Continuez à marquer sur les cibles encore ouvertes chez l’adversaire, jusqu’à le rattraper.',
      'Et à égalité de points ?',
      'Celui qui ferme tout à égalité gagne : il suffit de ne pas être derrière.',
      'Le 12 compte ?',
      'Non. Hors des sept cibles, une fléchette ne vaut rien.',
      'Peut-on fermer la bulle d’une fléchette ?',
      'Non : le centre vaut 2 marques au plus, et il n’y a pas de triple sur la bulle.',
      'Ce que l’app compte',
      'Le Cricket n’entre pas dans les statistiques : moyennes, doubles et grosses volées ne valent qu’au X01.',
      'La partie reste dans l’historique, avec son classement de fin de partie.',
      'Les réglages possibles',
      'Comptage Standard : les points sont pour soi · Cut-throat : les points vont aux adversaires',
      'Cibles Les sept, toujours : elles ne se règlent pas',
    ])
  })
})

/* ------------------------------------------------------------------------
 * Révision 1 (boucle 7) : convergence sur `useModaleAuRetour` et
 * `useDialogueNatif`, appui à côté (U1), rechargement (U2), constats 2 à 8.
 * ---------------------------------------------------------------------- */

const livreX01 = () => screen.getByRole('button', { name: 'Règles du X01' })

describe('R1 — la feuille suit la discipline de la `Modale`', () => {
  it('le <dialog> est monté en permanence, fermé et vide, sans classe de `display`', async () => {
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    await screen.findByRole('button', { name: 'Règles du X01' })
    const boite = document.querySelector('dialog') as HTMLDialogElement
    expect(boite).not.toBeNull()
    expect(boite.open).toBe(false)
    expect(boite.childElementCount).toBe(0)
    const classes = boite.className.split(/\s+/)
    // Témoin : on lit bien la liste de classes de la feuille.
    expect(classes).toContain('animate-monter')
    const display =
      /^(?:flex|inline-flex|grid|inline-grid|block|inline-block|inline|contents|table)$/
    expect(classes.filter((classe) => display.test(classe.replace(/^(?:[\w-]+:)+/, '')))).toEqual(
      [],
    )
  })

  it('Échap (`cancel`) ferme la feuille sans quitter l’écran, une seule entrée dépilée', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    const feuille = await ouvrirLivre(utilisateur)

    const annulation = new Event('cancel', { cancelable: true })
    fireEvent(feuille, annulation)
    expect(annulation.defaultPrevented).toBe(true)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(livreX01()).toHaveAttribute('aria-expanded', 'false')

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('rend le focus au livre même quand rien n’avait le focus (Safari, bouton touché)', async () => {
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const livre = await screen.findByRole('button', { name: 'Règles du X01' })
    expect(livre).not.toHaveFocus()

    // `fireEvent.click` ne donne pas le focus au bouton, comme Safari au doigt.
    fireEvent.click(livre)
    const fermer = await screen.findByRole('button', { name: 'Fermer' })
    expect(fermer).toHaveFocus()
    fireEvent.click(fermer)
    await waitFor(() => expect(livre).toHaveFocus())
  })

  it('la tête n’est pas un <header> ; le bas du bandeau est mesuré par `.bandeau-match`', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const feuille = await ouvrirLivre(utilisateur)
    expect(feuille.querySelector('header')).toBeNull()
    // Témoin : le bandeau, lui, est bien un <header> qui porte le repère.
    expect(livreX01().closest('header')).toHaveClass('bandeau-match')
  })

  it('P3-4 : `--haut-feuille` suit le bas du bandeau, et le suit encore après un `resize`', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const bandeau = (await screen.findByRole('button', { name: 'Règles du X01' })).closest(
      '.bandeau-match',
    ) as HTMLElement
    // Le haut à 0 : prendre `.top` au lieu de `.bottom` donnerait 0px.
    bandeau.getBoundingClientRect = () => new DOMRect(0, 0, 844, 51)
    const feuille = await ouvrirLivre(utilisateur)
    expect(feuille.style.getPropertyValue('--haut-feuille')).toBe('51px')

    bandeau.getBoundingClientRect = () => new DOMRect(0, 0, 844, 60)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(feuille.style.getPropertyValue('--haut-feuille')).toBe('60px')
  })

  it('P3-1 : le nom de la partie garde son retrait et sa police', async () => {
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const bandeau = (await screen.findByRole('button', { name: 'Règles du X01' })).closest(
      '.bandeau-match',
    ) as HTMLElement
    const nom = bandeau.querySelector(':scope > p')
    expect(nom).toHaveClass('pl-11', 'font-score', 'truncate')
  })

  it('P3-6 : `Phrase` rend ses mots forts en <strong>, avec l’encre de la feuille', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01({ doubleOut: true })
    ouvrirMatch(services, matchId)
    const feuille = await ouvrirLivre(utilisateur)
    const enBref = within(feuille).getByText('En bref').closest('section') as HTMLElement
    const forts = [...enBref.querySelectorAll('strong')]
    expect(forts.length).toBeGreaterThan(0)
    for (const fort of forts) expect(fort).toHaveClass('font-semibold', 'text-craie-vive')

    await deplier(utilisateur, /Cas particuliers/)
    const grise = within(feuille)
      .getAllByRole('listitem')
      .find((li) => li.textContent?.startsWith('Checkout libre'))
    const fortGris = grise?.querySelector('strong')
    expect(fortGris).not.toBeNull()
    expect(fortGris).toHaveClass('font-semibold', 'text-craie-2-regles')
  })

  it('un double appui sur le livre n’empile qu’une entrée', async () => {
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    const livre = await screen.findByRole('button', { name: 'Règles du X01' })
    act(() => {
      livre.click()
      livre.click()
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })
})

describe('P3-6 — `Phrase` dans la fiche de l’étape 2', () => {
  it('les mots forts de la fiche sont des <strong> en `craie`', async () => {
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/cricket' })
    await screen.findByRole('button', { name: 'Règles du Cricket' })
    const forts = [...document.querySelectorAll('strong')].filter((s) => !s.closest('dialog'))
    expect(forts.length).toBeGreaterThan(0)
    for (const fort of forts) expect(fort.className).toBe('text-craie')
  })
})

describe('R1 / U1 — un appui à côté ferme la feuille', () => {
  it('sur le match : un appui sur le voile (au-dessus de la feuille) ferme et dépile', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId, ['/', `/partie/${matchId}`])
    const feuille = (await ouvrirLivre(utilisateur)) as HTMLDialogElement
    // Portrait sur le match : la feuille commence à 210 px.
    feuille.getBoundingClientRect = () => new DOMRect(0, 210, 390, 634)

    fireEvent.pointerDown(feuille, { clientX: 100, clientY: 80 })
    fireEvent.click(feuille, { clientX: 100, clientY: 80 })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('à l’étape 2 en paysage : un appui sur la partie gauche ferme', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    const feuille = (await ouvrirLivre(utilisateur)) as HTMLDialogElement
    // Paysage 844 × 390 : la feuille occupe le côté droit (52 %).
    feuille.getBoundingClientRect = () => new DOMRect(405, 0, 439, 390)

    fireEvent.pointerDown(feuille, { clientX: 100, clientY: 200 })
    fireEvent.click(feuille, { clientX: 100, clientY: 200 })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe('/nouvelle-partie/x01')
  })

  it('un appui dans la feuille, ou un glisser parti d’elle, ne ferme pas', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01()
    ouvrirMatch(services, matchId)
    const feuille = (await ouvrirLivre(utilisateur)) as HTMLDialogElement
    feuille.getBoundingClientRect = () => new DOMRect(0, 210, 390, 634)
    const titre = within(feuille).getByRole('heading', { level: 2 })

    fireEvent.pointerDown(titre, { clientX: 100, clientY: 250 })
    fireEvent.click(titre, { clientX: 100, clientY: 250 })
    // Sur la bordure : la cible est le <dialog>, mais le point est dans sa boîte.
    fireEvent.pointerDown(feuille, { clientX: 1, clientY: 211 })
    fireEvent.click(feuille, { clientX: 1, clientY: 211 })
    // Un glisser parti de la feuille, lâché sur le voile.
    fireEvent.pointerDown(titre, { clientX: 100, clientY: 250 })
    fireEvent.click(feuille, { clientX: 100, clientY: 80 })
    // P3-2 : un glisser parti du voile, lâché dans la feuille (sur sa bordure).
    fireEvent.pointerDown(feuille, { clientX: 100, clientY: 80 })
    fireEvent.click(feuille, { clientX: 100, clientY: 300 })

    expect(feuille.open).toBe(true)
    expect(locationCourante().state).toMatchObject({ regles: 'ouverte' })
  })
})

describe('R1 / U2 — après un rechargement feuille ouverte', () => {
  it('elle se rouvre, rubriques repliées, et le retour la ferme', async () => {
    const { services, matchId } = await partieX01()
    renderWithServices(<App />, {
      services,
      historique: ['/', { pathname: `/partie/${matchId}`, state: { regles: 'ouverte' } }],
    })
    const feuille = await screen.findByRole('dialog', { name: 'Règles du X01' })
    expect(within(feuille).queryAllByRole('button', { expanded: true })).toEqual([])
    expect(within(feuille).getByRole('button', { name: 'Fermer' })).toHaveFocus()

    await retourTelephone()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(locationCourante().pathname).toBe('/')
  })

  it('P3-5 : pile réaliste — le premier retour ferme sur le match, le second quitte', async () => {
    const { services, matchId } = await partieX01()
    renderWithServices(<App />, {
      services,
      historique: [
        '/',
        `/partie/${matchId}`,
        { pathname: `/partie/${matchId}`, state: { regles: 'ouverte' } },
      ],
    })
    expect(await screen.findByRole('dialog', { name: 'Règles du X01' })).toBeInTheDocument()

    await retourTelephone()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(locationCourante().pathname).toBe(`/partie/${matchId}`)
    expect(document.querySelector('dialog[open]')).toBeNull()

    await retourTelephone()
    expect(locationCourante().pathname).toBe('/')
  })

  it('un état d’historique inconnu n’ouvre rien (liste fermée)', async () => {
    const { services, matchId } = await partieX01()
    renderWithServices(<App />, {
      services,
      historique: [{ pathname: `/partie/${matchId}`, state: { regles: true } }],
    })
    expect(await screen.findByRole('button', { name: 'Règles du X01' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('R1 / constat 8 — sets, départ et manches arrivent jusqu’à « Ce soir »', () => {
  it('sur un match : 301, premier à 3 manches, sur un double, 2 sets', async () => {
    const utilisateur = userEvent.setup()
    const { services, matchId } = await partieX01({
      startingScore: 301,
      legsToWin: 3,
      setsToWin: 2,
      doubleOut: true,
    })
    ouvrirMatch(services, matchId)
    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe(
      '301 · premier à 3 manches · checkout sur un double · entrée libre · premier à 2 sets',
    )
  })

  it('à l’étape 2 : 701, premier à 3 manches, 2 sets', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie/x01' })
    await screen.findByRole('button', { name: 'Règles du X01' })
    const depart = within(screen.getByRole('group', { name: 'Score de départ' }))
    await utilisateur.click(depart.getByRole('button', { name: '701' }))
    const manches = within(screen.getByRole('group', { name: 'Manches à gagner' }))
    await utilisateur.click(manches.getByRole('button', { name: '3' }))
    await utilisateur.click(screen.getByRole('button', { name: /plus de réglages/i }))
    const sets = within(screen.getByRole('group', { name: 'Sets à gagner' }))
    await utilisateur.click(sets.getByRole('button', { name: '2' }))

    await ouvrirLivre(utilisateur)
    expect(ceSoir()).toBe(
      '701 · premier à 3 manches · checkout libre · entrée libre · premier à 2 sets',
    )
  })
})

describe('R1 / constat 4 (C9) — « En bref » du Tour du monde lu dans le parcours', () => {
  const enBref = (cibles: readonly SegmentDart[]) =>
    texteDe(contenuRegles({ mode: 'TOUR_DU_MONDE', cibles }, SORTIES).enBref)

  it('le parcours du domaine : la phrase de la planche, mot pour mot', () => {
    expect(enBref(TourDuMondeConfig.create().targets)).toBe(
      'On part du 20, on descend jusqu’au 1, puis on finit sur la bulle. Celui qui boucle le tour avec le moins de fléchettes gagne.',
    )
  })

  it('un parcours plus court qui descend : les nombres suivent', () => {
    expect(enBref([5, 4, 'BULL'])).toBe(
      'On part du 5, on descend jusqu’au 4, puis on finit sur la bulle. Celui qui boucle le tour avec le moins de fléchettes gagne.',
    )
  })

  /** P3-7 (tranché par l'utilisateur) : un parcours importé arbitraire se dit en liste neutre. */
  it.each([
    [[1, 2, 3], 'Le parcours de cette partie : 1, 2 et 3.', '1 → 3 · 3 cibles · rien à régler'],
    [['BULL'], 'Le parcours de cette partie : la bulle.', 'la bulle · 1 cible · rien à régler'],
    [['MISS'], 'Le parcours de cette partie : hors cible.', 'hors cible · 1 cible · rien à régler'],
    [
      [20, 'MISS', 19],
      'Le parcours de cette partie : 20, hors cible et 19.',
      '20 → 19 · 3 cibles · rien à régler',
    ],
    [
      [20, 'BULL'],
      'Le parcours de cette partie : 20 et la bulle.',
      '20 → la bulle · 2 cibles · rien à régler',
    ],
    [[7], 'Le parcours de cette partie : 7.', '7 · 1 cible · rien à régler'],
  ] as const)(
    'parcours importé %j : phrase neutre, cohérente avec « Ce soir »',
    (cibles, phrase, soir) => {
      const contenu = contenuRegles({ mode: 'TOUR_DU_MONDE', cibles }, SORTIES)
      expect(texteDe(contenu.enBref)).toBe(
        `${phrase} Celui qui boucle le tour avec le moins de fléchettes gagne.`,
      )
      expect(contenu.ceSoir).toBe(soir)
      expect(toutLeTexte(contenu)).not.toMatch(/undefined|MISS|on descend/)
    },
  )

  it('le parcours du domaine garde sa forme dans « Ce soir »', () => {
    expect(
      contenuRegles({ mode: 'TOUR_DU_MONDE', cibles: TourDuMondeConfig.create().targets }, SORTIES)
        .ceSoir,
    ).toBe('20 → 1, puis la bulle · 21 cibles · rien à régler')
  })

  it('sur un match au parcours importé, la feuille le dit', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const k = await services.managePlayers.create('Kevin')
    const j = await services.managePlayers.create('Julien')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [k.id, j.id],
      config: TourDuMondeConfig.create({ targets: [1, 2, 3] }),
    })
    ouvrirMatch(services, matchId)
    const feuille = await ouvrirLivre(utilisateur)
    expect(within(feuille).getByText(/Le parcours de cette partie/)).toBeVisible()
    expect(within(feuille).queryByText(/on descend/)).toBeNull()
  })
})
