import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { InMemoryMatchRepository } from '@/infrastructure/memory/InMemoryMatchRepository'
import { InMemoryPlayerRepository } from '@/infrastructure/memory/InMemoryPlayerRepository'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { CLE_JOUEURS } from '@/ui/hooks/useJoueurs'
import {
  JOUEUR_SUPPRIME,
  LIBELLE_CHARGEMENT_PARTIES,
  LIBELLE_ERREUR_ACCUEIL,
  libelleGagneEnManches,
  TITRE_PARTIE_EN_COURS,
} from '@/ui/labels'
import { fakeServices, SettableClock } from '../fakes'
import { lancer } from '../use-cases/lancerPartie'
import { flechette, retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

const le = (mois: number, jour: number, heure = 0, minute = 0): number =>
  new Date(2026, mois, jour, heure, minute).getTime()

const OCT = 9
/** Mardi 13 octobre 2026, 21 h 30. */
const MAINTENANT = le(OCT, 13, 21, 30)

const base = async () => {
  const clock = new SettableClock(MAINTENANT)
  const { services, dependencies } = fakeServices({ clock })
  const kevin = (await services.managePlayers.create('Kevin')).id
  const julien = (await services.managePlayers.create('Julien')).id
  const joueurs = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]

  /** Lance une partie « à tel instant », puis remet l'horloge à l'heure de l'écran. */
  const a = async <T,>(instant: number, creer: () => Promise<T>): Promise<T> => {
    clock.regler(instant)
    try {
      return await creer()
    } finally {
      clock.regler(MAINTENANT)
    }
  }

  /** Un X01 solo fini d'un double 20 : 1 manche jouée, terminée. */
  const x01Termine = (instant: number, nom: string) =>
    a(instant, async () => {
      const matchId = await services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
        name: nom,
      })
      await services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })
      return matchId
    })

  const enCours = (instant: number, mode: GameModeId, nom?: string) =>
    a(instant, () => lancer(services, mode, joueurs(mode), nom))

  return { services, dependencies, clock, kevin, julien, joueurs, a, x01Termine, enCours }
}

const ouvrir = (services: Services, route = '/') => renderWithServices(<App />, { services, route })

/** Les cartes de l'Accueil : les liens vers une partie, dans l'ordre d'affichage. */
const cartes = () =>
  screen.getAllByRole('link').filter((lien) => lien.getAttribute('href')?.startsWith('/partie/'))

const carte = (nom: RegExp | string) => screen.getByRole('link', { name: nom })

describe('Accueil — parties récentes, groupées par jour', () => {
  /** Critère 1. */
  it('range « Aujourd’hui », « Cette semaine », et écarte J-7', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 21, 4), 'Ce soir')
    await x01Termine(le(OCT, 7, 20, 10), 'Mercredi dernier') // J-6
    await x01Termine(le(OCT, 6, 20, 0), 'Trop vieille') // J-7

    ouvrir(services)

    const aujourdhui = await screen.findByRole('region', { name: 'Aujourd’hui' })
    expect(within(aujourdhui).getByRole('heading', { name: 'Ce soir', level: 3 })).toBeVisible()
    expect(within(aujourdhui).getByText(/21 h 04/)).toBeInTheDocument()

    const semaine = screen.getByRole('region', { name: 'Cette semaine' })
    expect(within(semaine).getByRole('heading', { name: 'Mercredi dernier' })).toBeVisible()
    expect(within(semaine).getByText(/mercredi 20 h 10/)).toBeInTheDocument()

    expect(screen.queryByText('Trop vieille')).not.toBeInTheDocument()
  })

  it('les plus récentes d’abord, dans un groupe', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 10, 0), 'Matin')
    await x01Termine(le(OCT, 13, 20, 0), 'Soir')
    await x01Termine(le(OCT, 13, 15, 0), 'Après-midi')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes().map((lien) => lien.textContent)).toEqual([
      expect.stringContaining('Soir'),
      expect.stringContaining('Après-midi'),
      expect.stringContaining('Matin'),
    ])
  })

  /** Critère 2, côté écran. */
  it('une partie de 23 h 50 passe de « Aujourd’hui » à « Cette semaine » après minuit', async () => {
    const { services, clock, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 23, 50), 'Tard')

    clock.regler(le(OCT, 13, 23, 55))
    const { unmount } = ouvrir(services)
    const avant = await screen.findByRole('region', { name: 'Aujourd’hui' })
    expect(within(avant).getByRole('heading', { name: 'Tard' })).toBeVisible()
    unmount()

    clock.regler(le(OCT, 14, 0, 10))
    ouvrir(services)
    const semaine = await screen.findByRole('region', { name: 'Cette semaine' })
    expect(within(semaine).getByRole('heading', { name: 'Tard' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Aujourd’hui' })).not.toBeInTheDocument()
  })

  /** Une date dans le futur ne casse pas l'écran et n'y colle pas. */
  it('écarte une partie datée du futur sans casser le reste', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Normale')
    await x01Termine(new Date(2100, 0, 1).getTime(), 'Du futur')

    ouvrir(services)

    expect(await screen.findByRole('heading', { name: 'Normale' })).toBeVisible()
    expect(screen.queryByText('Du futur')).not.toBeInTheDocument()
  })

  it('plafonne l’Accueil à 30 cartes', async () => {
    const { services, x01Termine } = await base()
    for (let rang = 0; rang < 32; rang += 1)
      await x01Termine(le(OCT, 13, 8, rang), `Partie ${rang}`)

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes()).toHaveLength(30)
  })
})

describe('Accueil — la partie en cours', () => {
  /** Critère 1 : au-delà de 7 jours, en première carte quand même. */
  it('reste la première carte même au-delà de 7 jours, avec « Reprendre »', async () => {
    const { services, x01Termine, enCours } = await base()
    const vieille = await enCours(le(OCT, 5, 20, 0), 'X01', 'Vieille')
    await x01Termine(le(OCT, 13, 20, 0), 'Récente')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    const [premiere] = cartes()
    expect(premiere).toHaveAttribute('href', `/partie/${vieille}`)
    expect(premiere).toHaveTextContent('Vieille')
    expect(premiere).toHaveTextContent('Reprendre')
    expect(premiere).not.toHaveTextContent('Abandonnée')
    // Elle n'est dans aucun groupe : un seul exemplaire, sans doublon.
    expect(screen.getAllByRole('heading', { name: 'Vieille' })).toHaveLength(1)
    expect(
      within(screen.getByRole('region', { name: 'Aujourd’hui' })).queryByText('Vieille'),
    ).not.toBeInTheDocument()
  })

  /** Pas de saut de niveau : `h1` → `h2` → `h3` (les cartes de l'Accueil sont des `h3`). */
  it('la carte épinglée est précédée d’un titre de niveau 2, invisible', async () => {
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 9, 0), 'X01', 'Épinglée')

    ouvrir(services)
    await screen.findByRole('heading', { name: 'Épinglée', level: 3 })

    const titres = screen.getAllByRole('heading').map((titre) => titre.tagName)
    expect(titres.indexOf('H3')).toBeGreaterThan(-1)
    // Le premier `h3` a au moins un `h2` devant lui.
    expect(titres.slice(0, titres.indexOf('H3'))).toContain('H2')
    expect(screen.getByRole('heading', { name: TITRE_PARTIE_EN_COURS, level: 2 })).toHaveClass(
      'sr-only',
    )
  })

  it('une partie en cours d’aujourd’hui est épinglée en tête, une seule fois', async () => {
    const { services, x01Termine, enCours } = await base()
    await x01Termine(le(OCT, 13, 10, 0), 'Finie')
    const id = await enCours(le(OCT, 13, 9, 0), 'CRICKET', 'En vol')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes()[0]).toHaveAttribute('href', `/partie/${id}`)
    expect(screen.getAllByRole('heading', { name: 'En vol' })).toHaveLength(1)
  })

  it('« Reprendre » n’habille que la partie en cours, jamais une abandonnée ni une terminée', async () => {
    const { services, x01Termine, enCours } = await base()
    await x01Termine(le(OCT, 13, 10, 0), 'Finie')
    await enCours(le(OCT, 13, 11, 0), 'X01', 'Abandonnée une')
    await enCours(le(OCT, 13, 12, 0), 'X01', 'Celle en cours')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(screen.getAllByText('Reprendre')).toHaveLength(1)
    expect(carte(/Celle en cours/)).toHaveTextContent('Reprendre')
    expect(carte(/Abandonnée une/)).not.toHaveTextContent('Reprendre')
    expect(carte(/Finie/)).not.toHaveTextContent('Reprendre')
  })

  /** Critère 4 : « Abandonnée », les quatre modes. */
  it.each(GAME_MODE_IDS)(
    '%s : la plus ancienne non terminée est « Abandonnée », et reprenable',
    async (mode) => {
      const { services, enCours } = await base()
      const ancienne = await enCours(le(OCT, 13, 18, 0), mode, 'Ancienne')
      await enCours(le(OCT, 13, 20, 0), mode, 'Dernière')

      ouvrir(services)
      await screen.findByRole('region', { name: 'Aujourd’hui' })

      expect(carte(/Ancienne/)).toHaveTextContent('Abandonnée')
      expect(carte(/Ancienne/)).toHaveAttribute('href', `/partie/${ancienne}`)
      expect(carte(/Dernière/)).not.toHaveTextContent('Abandonnée')
      expect(screen.getAllByText('Abandonnée')).toHaveLength(1)

      // Le badge parle à la place du statut : jamais « En cours » à côté.
      expect(carte(/Ancienne/)).not.toHaveTextContent('En cours')
      // La dernière dit son avancement : « En cours », ou les manches au X01.
      expect(carte(/Dernière/)).toHaveTextContent(mode === 'X01' ? '0 manche jouée' : 'En cours')
    },
  )

  /** Critère 4, la limite des 20 : `GetOngoingMatch` ne regarde pas plus loin. */
  describe('au-delà des 20 parties les plus récentes', () => {
    const VINGT = 20
    const finies = async (x01Termine: (instant: number, nom: string) => Promise<unknown>) => {
      for (let rang = 0; rang < VINGT; rang += 1)
        await x01Termine(le(OCT, 13, 9, rang), `Finie ${rang}`)
    }

    it('une non terminée plus ancienne que les 20, encore dans la semaine : abandonnée, personne d’épinglé', async () => {
      const { services, x01Termine, enCours } = await base()
      await enCours(le(OCT, 13, 8, 0), 'X01', 'Oubliée')
      await finies(x01Termine)

      ouvrir(services)
      await screen.findByRole('region', { name: 'Aujourd’hui' })

      expect(cartes()).toHaveLength(VINGT + 1)
      expect(carte(/Oubliée/)).toHaveTextContent('Abandonnée')
      expect(screen.queryByText('Reprendre')).not.toBeInTheDocument()
    })

    it('la même, au-delà de 7 jours : absente de l’Accueil, et toujours personne d’épinglé', async () => {
      const { services, x01Termine, enCours } = await base()
      await enCours(le(OCT, 2, 8, 0), 'X01', 'Oubliée')
      await finies(x01Termine)

      ouvrir(services)
      await screen.findByRole('region', { name: 'Aujourd’hui' })

      expect(cartes()).toHaveLength(VINGT)
      expect(screen.queryByRole('heading', { name: 'Oubliée' })).not.toBeInTheDocument()
      expect(screen.queryByText('Abandonnée')).not.toBeInTheDocument()
      expect(screen.queryByText('Reprendre')).not.toBeInTheDocument()
    })
  })
})

describe('Accueil — la carte : ✓, liseré, vainqueur', () => {
  /** Le ✓ de lucide-react porte la classe `lucide-check` : c'est ce qui le distingue des autres icônes. */
  const coche = (lien: HTMLElement) => lien.querySelector('svg.lucide-check')

  it('le ✓ marque une partie terminée, et seulement elle', async () => {
    const { services, x01Termine, enCours } = await base()
    await x01Termine(le(OCT, 13, 10, 0), 'Finie')
    await enCours(le(OCT, 13, 11, 0), 'X01', 'Abandonnée une')
    await enCours(le(OCT, 13, 12, 0), 'X01', 'Celle en cours')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(coche(carte(/Finie/))).not.toBeNull()
    expect(coche(carte(/Abandonnée une/))).toBeNull()
    expect(coche(carte(/Celle en cours/))).toBeNull()
    expect(coche(carte(/Finie/))).toHaveAttribute('aria-hidden', 'true')
  })

  it.each(GAME_MODE_IDS)(
    '%s : le liseré de la carte est en laiton, pour tous les jeux',
    async (mode) => {
      const { services, enCours } = await base()
      await enCours(le(OCT, 13, 12, 0), mode, 'Colorée')

      ouvrir(services)
      const lien = await screen.findByRole('link', { name: /Colorée/ })

      // Une classe de token, pas une valeur en ligne : plus aucune teinte par jeu
      // (la relecture à l'écran juge le rendu).
      expect(lien).toHaveClass('border-l-4', 'border-laiton')
      expect(lien.getAttribute('style') ?? '').not.toContain('border-left')
    },
  )

  it('X01 terminé : « Julien gagne · N manches », pluriel juste', async () => {
    const { services, kevin, julien, a } = await base()
    const id = await a(le(OCT, 13, 20, 0), () =>
      services.startMatch.execute({
        playerIds: [kevin, julien],
        config: X01Config.create({ startingScore: 40, legsToWin: 2, setsToWin: 1 }),
        name: 'Duel',
      }),
    )
    const sortir = () => services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })

    // Kevin gagne la manche 1, Julien la 2 (le départ alterne), Kevin la 3 : 3 manches.
    await sortir()
    await sortir()
    await sortir()

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(carte(/Duel/)).toHaveTextContent('Kevin gagne · 3 manches')
    expect(carte(/Duel/)).not.toHaveTextContent('jouée')
  })

  it('le libellé s’accorde : 1 manche, 5 manches', () => {
    expect(libelleGagneEnManches('Julien', 1)).toBe('Julien gagne · 1 manche')
    expect(libelleGagneEnManches('Julien', 5)).toBe('Julien gagne · 5 manches')
  })

  it('X01 terminé dont le vainqueur est supprimé : le nom neutre, comme au Cricket', async () => {
    const { services, kevin, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Orpheline')
    await services.managePlayers.remove(kevin)

    ouvrir(services)
    await screen.findByRole('heading', { name: 'Orpheline' })

    expect(carte(/Orpheline/)).toHaveTextContent(libelleGagneEnManches(JOUEUR_SUPPRIME, 1))
  })
})

describe('Accueil — les statuts par mode', () => {
  /** Critères 3 et 4. */
  it('X01 : « N manches jouées », tous sets confondus', async () => {
    const { services, kevin, a } = await base()
    const id = await a(le(OCT, 13, 20, 0), () =>
      services.startMatch.execute({
        playerIds: [kevin],
        config: X01Config.create({ startingScore: 40, legsToWin: 2, setsToWin: 2 }),
        name: 'Aux sets',
      }),
    )
    const sortir = () => services.recordVisit.execute({ matchId: id, darts: [Dart.double(20)] })

    const { unmount } = ouvrir(services)
    expect(await screen.findByText('0 manche jouée')).toBeInTheDocument()
    unmount()

    await sortir()
    await sortir()
    await sortir()
    ouvrir(services)
    expect(await screen.findByText('3 manches jouées')).toBeInTheDocument()
  })

  it('Tour du monde, Cricket et entraînement : « En cours », puis le résultat', async () => {
    const { services, kevin, julien, a } = await base()

    const tdm = TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] })
    const bouclage = [Dart.single(20), Dart.single(19), Dart.bull()]
    const rate = [Dart.miss(), Dart.miss(), Dart.miss()]

    const gagne = await a(le(OCT, 13, 10, 0), () =>
      services.playTourDuMonde.start({
        playerIds: [kevin, julien],
        config: tdm,
        name: 'TdM gagné',
      }),
    )
    await services.playTourDuMonde.recordVisit(gagne, bouclage)
    await services.playTourDuMonde.recordVisit(gagne, rate)

    const nul = await a(le(OCT, 13, 11, 0), () =>
      services.playTourDuMonde.start({ playerIds: [kevin, julien], config: tdm, name: 'TdM nul' }),
    )
    await services.playTourDuMonde.recordVisit(nul, bouclage)
    await services.playTourDuMonde.recordVisit(nul, bouclage)

    const cricket = await a(le(OCT, 13, 12, 0), () =>
      services.playCricket.start({
        playerIds: [kevin, julien],
        config: CricketConfig.create({ targets: [20, 19, 'BULL'] }),
        name: 'Cricket gagné',
      }),
    )
    await services.playCricket.recordVisit(cricket, [
      Dart.triple(20),
      Dart.triple(19),
      Dart.bullseye(),
    ])
    await services.playCricket.recordVisit(cricket, rate)
    await services.playCricket.recordVisit(cricket, [Dart.bull()])

    const exercice = await a(le(OCT, 13, 13, 0), () =>
      services.playCheckoutPractice.start({
        playerId: kevin,
        config: CheckoutPracticeConfig.create({ rounds: 1 }),
        name: 'Exercice fini',
      }),
    )
    await services.playCheckoutPractice.recordVisit(exercice, rate)

    // Une seule partie non terminée : la plus récente, en cours.
    await a(le(OCT, 13, 14, 0), () =>
      lancer(services, 'TOUR_DU_MONDE', [kevin, julien], 'TdM en cours'),
    )

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(carte(/TdM gagné/)).toHaveTextContent('Kevin gagne')
    expect(carte(/TdM nul/)).toHaveTextContent('Match nul')
    expect(carte(/Cricket gagné/)).toHaveTextContent('Kevin gagne')
    expect(carte(/Exercice fini/)).toHaveTextContent('0 / 1 sorties')
    expect(carte(/TdM en cours/)).toHaveTextContent('En cours')

    // Terminées : le résumé. Sinon : la partie.
    for (const [nom, id] of [
      [/TdM gagné/, gagne],
      [/TdM nul/, nul],
      [/Cricket gagné/, cricket],
      [/Exercice fini/, exercice],
    ] as const) {
      expect(carte(nom)).toHaveAttribute('href', `/partie/${id}/resume`)
    }
  })

  it('un joueur supprimé garde sa carte, avec un nom neutre', async () => {
    const { services, kevin, julien, a } = await base()
    await a(le(OCT, 13, 20, 0), () =>
      services.playCricket.start({
        playerIds: [kevin, julien],
        config: CricketConfig.create({ targets: [20, 19, 'BULL'] }),
        name: 'Sans Julien',
      }),
    )
    await services.managePlayers.remove(julien)

    ouvrir(services)

    expect(await screen.findByRole('heading', { name: 'Sans Julien' })).toBeVisible()
    expect(carte(/Sans Julien/)).toHaveTextContent(JOUEUR_SUPPRIME)
  })
})

describe('Accueil — le tap', () => {
  /** Critère 5. */
  it('une partie terminée ouvre son résumé', async () => {
    const utilisateur = userEvent.setup()
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Finie')

    ouvrir(services)
    await utilisateur.click(await screen.findByRole('link', { name: /Finie/ }))

    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
  })

  it.each(['en cours', 'abandonnée'] as const)('une partie %s reprend la partie', async (cas) => {
    const utilisateur = userEvent.setup()
    const { services, enCours } = await base()
    // Pour l'abandonnée, une plus récente prend la place de « en cours ».
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Visée')
    if (cas === 'abandonnée') await enCours(le(OCT, 13, 19, 0), 'X01', 'Plus récente')

    ouvrir(services)
    await utilisateur.click(await screen.findByRole('link', { name: /Visée/ }))

    expect(await screen.findByLabelText('Score restant de Kevin')).toBeInTheDocument()
  })

  it('chaque carte est une seule cible focalisable', async () => {
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Seule')

    ouvrir(services)
    const lien = await screen.findByRole('link', { name: /Seule/ })

    const li = lien.closest('li')
    expect(li).not.toBeNull()
    expect(within(li as HTMLElement).getAllByRole('link')).toHaveLength(1)
    expect(within(li as HTMLElement).queryAllByRole('button')).toHaveLength(0)
  })
})

describe('Accueil — état vide', () => {
  /** Critère 7. */
  it('sans partie et sans profil : une ligne et « Créer un joueur »', async () => {
    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })

    ouvrir(services)

    expect(await screen.findByText('Aucune partie jouée pour l’instant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Créer un joueur/ })).toHaveAttribute(
      'href',
      '/joueurs',
    )
  })

  it('sans partie mais avec un profil : la ligne seule', async () => {
    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })
    await services.managePlayers.create('Kevin')

    ouvrir(services)

    expect(await screen.findByText('Aucune partie jouée pour l’instant')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Créer un joueur/ })).not.toBeInTheDocument()
  })

  it('seulement une partie terminée de plus de 7 jours : l’état vide', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 1, 20, 0), 'Ancienne finie')

    ouvrir(services)

    expect(await screen.findByText('Pas de partie cette semaine')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Créer un joueur/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Ancienne finie')).not.toBeInTheDocument()
  })

  it('l’ancien bloc « Partie en cours » et la feuille « Ce soir à l’oche » ont disparu', async () => {
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Seule')

    ouvrir(services)
    await screen.findByRole('link', { name: /Seule/ })

    expect(screen.queryByRole('region', { name: 'Partie en cours' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Ce soir à l’oche/)).not.toBeInTheDocument()
  })
})

/** Un dépôt de parties dont les lectures échouent : une panne, sans mock. */
class DepotPartiesEnPanne extends InMemoryMatchRepository {
  override async listRecent(): Promise<never> {
    throw new Error('IndexedDB indisponible')
  }
  override async listAll(): Promise<never> {
    throw new Error('IndexedDB indisponible')
  }
}

/** Un dépôt de parties qui ne répond jamais : l'écran reste en chargement. */
class DepotPartiesLent extends InMemoryMatchRepository {
  override listRecent(): Promise<never> {
    return new Promise<never>(() => {})
  }
}

class DepotJoueursEnPanne extends InMemoryPlayerRepository {
  override async listAll(): Promise<never> {
    throw new Error('IndexedDB indisponible')
  }
}

class DepotJoueursLent extends InMemoryPlayerRepository {
  override listAll(): Promise<never> {
    return new Promise<never>(() => {})
  }
}

const LIBELLE_JAMAIS = 'Aucune partie jouée pour l’instant'
const LIBELLE_SEMAINE = 'Pas de partie cette semaine'

describe('Accueil — robustesse : erreur, chargement, états vides, fin de liste', () => {
  it('une lecture des parties qui échoue : une alerte, jamais « Pas de partie cette semaine »', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      matches: new DepotPartiesEnPanne(),
    })

    ouvrir(services)

    const alerte = await screen.findByRole('alert')
    expect(alerte).toHaveTextContent(LIBELLE_ERREUR_ACCUEIL)
    expect(alerte).not.toHaveTextContent('IndexedDB')
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
    // Le bouton reste là : on peut toujours lancer une partie.
    expect(screen.getByRole('link', { name: 'Nouvelle partie' })).toBeInTheDocument()
  })

  /**
   * Isoler une requête : les deux autres sont déjà au chaud dans le cache (valeurs
   * vides, `staleTime` infini), seule celle qu'on omet s'exécute, contre le dépôt
   * en panne. Couplé aux clés de `clesRequetes.ts` (+ `['historique', 'accueil']`
   * et `['joueurs']`, publiques) ; aucune valeur interne comme 20 ou 30.
   */
  const CLE_ACCUEIL = [...CLE_HISTORIQUE, 'accueil'] as const
  const clientAmorce = (chaudes: readonly ('encours' | 'historique' | 'joueurs')[]) => {
    const queryClient = clientSansRevalidation()
    if (chaudes.includes('encours')) queryClient.setQueryData(CLE_MATCH_EN_COURS, null)
    if (chaudes.includes('historique')) queryClient.setQueryData(CLE_ACCUEIL, [])
    if (chaudes.includes('joueurs')) queryClient.setQueryData(CLE_JOUEURS, [])
    return queryClient
  }

  it('seule la lecture de la partie en cours échoue : la même alerte', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      matches: new DepotPartiesEnPanne(),
    })

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientAmorce(['historique', 'joueurs']),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(LIBELLE_ERREUR_ACCUEIL)
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
  })

  it('seule la lecture de l’historique échoue : la même alerte', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      matches: new DepotPartiesEnPanne(),
    })

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientAmorce(['encours', 'joueurs']),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(LIBELLE_ERREUR_ACCUEIL)
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
  })

  it('seule la lecture des joueurs échoue : la même alerte', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      players: new DepotJoueursEnPanne(),
    })

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientAmorce(['encours', 'historique']),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(LIBELLE_ERREUR_ACCUEIL)
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
  })

  it('seuls les joueurs sont en chargement : le statut, ni « jamais joué » ni « Créer un joueur »', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      players: new DepotJoueursLent(),
    })

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientAmorce(['encours', 'historique']),
    })

    expect(await screen.findByRole('status')).toHaveTextContent(LIBELLE_CHARGEMENT_PARTIES)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Créer un joueur/ })).not.toBeInTheDocument()
  })

  it('une partie en cours seule, vieille de plus de 7 jours : épinglée, ni état vide ni « semaine calme »', async () => {
    const { services, enCours } = await base()
    await enCours(le(OCT, 2, 8, 0), 'X01', 'Vieille seule')

    ouvrir(services)

    expect(await screen.findByRole('link', { name: /Vieille seule/ })).toHaveTextContent(
      'Reprendre',
    )
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Toutes les parties' })).not.toBeInTheDocument()
  })

  it('le chargement est annoncé par un statut', async () => {
    const { services } = fakeServices({
      clock: new SettableClock(MAINTENANT),
      matches: new DepotPartiesLent(),
    })

    ouvrir(services)

    const statut = await screen.findByRole('status')
    expect(statut).toHaveTextContent(LIBELLE_CHARGEMENT_PARTIES)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
  })

  it('jamais joué : le libellé dédié, et pas de lien « Toutes les parties »', async () => {
    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })

    ouvrir(services)

    expect(await screen.findByText(LIBELLE_JAMAIS)).toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_SEMAINE)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Toutes les parties' })).not.toBeInTheDocument()
  })

  it('semaine calme : « Pas de partie cette semaine » et le lien vers l’historique', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 1, 20, 0), 'Ancienne finie')

    ouvrir(services)

    expect(await screen.findByText(LIBELLE_SEMAINE)).toBeInTheDocument()
    expect(screen.queryByText(LIBELLE_JAMAIS)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Toutes les parties' })).toHaveAttribute(
      'href',
      '/historique',
    )
  })

  it('une récente et une ancienne : la liste est visible, avec le lien', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Récente')
    await x01Termine(le(OCT, 1, 20, 0), 'Ancienne')

    ouvrir(services)

    expect(await screen.findByRole('heading', { name: 'Récente' })).toBeVisible()
    expect(screen.queryByText('Ancienne')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Toutes les parties' })).toHaveAttribute(
      'href',
      '/historique',
    )
  })

  it('31 parties dans la journée (30 ou plus) : le plafond est atteint, le lien vers l’historique est là', async () => {
    const { services, x01Termine } = await base()
    for (let rang = 0; rang < 31; rang += 1)
      await x01Termine(le(OCT, 13, 8, rang), `Partie ${rang}`)

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes()).toHaveLength(30)
    expect(screen.getByRole('link', { name: 'Toutes les parties' })).toBeInTheDocument()
  })

  it('peu de parties, toutes visibles : pas de lien « Toutes les parties »', async () => {
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Seule visible')

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(screen.queryByRole('link', { name: 'Toutes les parties' })).not.toBeInTheDocument()
  })

  it('« Créer un joueur » : le nom accessible est sans la flèche', async () => {
    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })

    ouvrir(services)

    const lien = await screen.findByRole('link', { name: 'Créer un joueur' })
    expect(lien.querySelector('[aria-hidden="true"]')).toHaveTextContent('→')
  })
})

describe('Accueil — le bouton « Nouvelle partie » fixé', () => {
  /** Critère 6, ce que jsdom peut voir : il est là avec 15 cartes, calé en `sticky`. */
  it('reste dans la page avec 15 cartes, calé au-dessus de la barre du bas', async () => {
    const { services, x01Termine } = await base()
    for (let rang = 0; rang < 15; rang += 1)
      await x01Termine(le(OCT, 13, 8, rang), `Partie ${rang}`)

    ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes()).toHaveLength(15)
    const bouton = screen.getByRole('link', { name: 'Nouvelle partie' })
    expect(bouton).toHaveClass('min-h-16')
    expect(bouton.parentElement).toHaveClass('sticky')
    expect(bouton.parentElement?.className).toContain('--hauteur-nav-basse')
  })

  /** Le filet de 3 px de la barre ne doit pas laisser de jour : même `calc`, au caractère près. */
  it('le bouton fixé et la barre du bas partagent le même calc de hauteur', async () => {
    const { services } = await base()

    ouvrir(services)
    const bouton = await screen.findByRole('link', { name: 'Nouvelle partie' })
    const barre = screen.getByRole('navigation', { name: 'Navigation principale' })

    const calc = /\[calc\([^\]]+\)\]/
    const decalage = bouton.parentElement?.className.match(/bottom-(\[calc\([^\]]+\)\])/)?.[1]
    const hauteur = barre.className.match(/\bh-(\[calc\([^\]]+\)\])/)?.[1]
    expect(decalage).toMatch(calc)
    expect(decalage).toBe(hauteur)
  })

  it('le bouton est présent aussi sans aucune partie', async () => {
    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })

    ouvrir(services)

    expect(await screen.findByRole('link', { name: 'Nouvelle partie' })).toBeInTheDocument()
  })
})

/** Une sonde qui garde la main sur le client TanStack Query de l'application. */
let client: QueryClient | null = null
const SondeClient = (): null => {
  client = useQueryClient()
  return null
}

/**
 * Un client **partagé** entre tous les écrans du test, et qui ne revalide jamais
 * tout seul (`staleTime` infini) : un Accueil rouvert n'affiche du neuf que si
 * une mutation a invalidé son cache. Sans ça, TanStack Query rechargerait au
 * remontage et le test passerait même sans l'invalidation qu'il prétend prouver.
 */
const clientSansRevalidation = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  })

describe('Accueil — l’invalidation du cache, avec un seul QueryClient', () => {
  /** Critère 9 : sans l'invalidation, le client partagé resservirait l'Accueil d'origine. */
  it('une fin de partie suivie de « On remet ça » : l’Accueil rouvert voit la nouvelle partie', async () => {
    const utilisateur = userEvent.setup()
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Finie')

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientSansRevalidation(),
    })
    await utilisateur.click(await screen.findByRole('link', { name: /Finie/ }))
    await utilisateur.click(await screen.findByRole('button', { name: /On remet ça/ }))
    await screen.findByLabelText('Score restant de Kevin')

    // Résumé, puis la nouvelle partie : deux reculs ramènent à l'Accueil.
    await retourTelephone()
    await retourTelephone()
    await screen.findByRole('region', { name: 'Aujourd’hui' })

    expect(cartes()).toHaveLength(2)
    expect(screen.getAllByText('Reprendre')).toHaveLength(1)
  })

  /**
   * L'invalidation de `['historique']` par `ActionsFinDePartie`, prouvée seule :
   * l'onglet Parties est chaud, `matchEnCours` n'est lu par aucun écran visité.
   */
  it('« On remet ça » depuis l’onglet Parties : l’Historique rouvert liste les deux parties', async () => {
    const utilisateur = userEvent.setup()
    const { services, x01Termine } = await base()
    await x01Termine(le(OCT, 13, 20, 0), 'Finie')

    renderWithServices(<App />, {
      services,
      route: '/historique',
      queryClient: clientSansRevalidation(),
    })
    const finie = await screen.findByRole('heading', { name: 'Finie', level: 2 })
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)

    await utilisateur.click(within(finie.closest('li') as HTMLElement).getByRole('link'))
    await utilisateur.click(await screen.findByRole('button', { name: /On remet ça/ }))
    await screen.findByLabelText('Score restant de Kevin')

    await retourTelephone()
    await retourTelephone()

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2))
  })

  it('une suppression à l’Historique : l’Accueil rouvert ne montre plus la partie, et reprend l’autre', async () => {
    const utilisateur = userEvent.setup()
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Ancienne')
    await enCours(le(OCT, 13, 20, 0), 'X01', 'Récente')

    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientSansRevalidation(),
    })
    expect(await screen.findByRole('link', { name: /Récente/ })).toHaveTextContent('Reprendre')
    expect(carte(/Ancienne/)).toHaveTextContent('Abandonnée')

    await utilisateur.click(screen.getByRole('link', { name: 'Parties' }))
    // Niveau 2 : l'Historique, pas la carte (niveau 3) de l'Accueil encore à l'écran.
    const recente = (await screen.findByRole('heading', { name: 'Récente', level: 2 })).closest(
      'li',
    )
    await utilisateur.click(
      within(recente as HTMLElement).getByRole('button', { name: 'Supprimer la partie' }),
    )
    await utilisateur.click(
      within(recente as HTMLElement).getByRole('button', {
        name: 'Confirmer la suppression de la partie',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Récente' })).toBeNull())

    await utilisateur.click(screen.getByRole('link', { name: 'Début' }))
    // Seule partie restante, donc épinglée : pas de groupe « Aujourd'hui ».
    await screen.findByText('Reprendre')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Récente' })).not.toBeInTheDocument()
      expect(carte(/Ancienne/)).toHaveTextContent('Reprendre')
      expect(carte(/Ancienne/)).not.toHaveTextContent('Abandonnée')
    })
  })

  /** Critère 4, de bout en bout : jouer une volée sur une « Abandonnée » inverse les deux statuts. */
  it('reprendre une abandonnée et y jouer une volée : elle devient « en cours », l’autre « Abandonnée »', async () => {
    const utilisateur = userEvent.setup()
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Ancienne')
    await enCours(le(OCT, 13, 20, 0), 'X01', 'Récente')

    // Le client par défaut, comme en production : l'Accueil rouvert se recharge.
    ouvrir(services)
    expect(await screen.findByRole('link', { name: /Récente/ })).toHaveTextContent('Reprendre')
    expect(carte(/Ancienne/)).toHaveTextContent('Abandonnée')

    await utilisateur.click(carte(/Ancienne/))
    await screen.findByLabelText('Score restant de Kevin')
    for (let fleche = 0; fleche < 3; fleche += 1) await flechette(utilisateur, '20')
    await retourTelephone()

    await waitFor(() => {
      expect(carte(/Ancienne/)).toHaveTextContent('Reprendre')
      expect(carte(/Ancienne/)).not.toHaveTextContent('Abandonnée')
      expect(carte(/Récente/)).toHaveTextContent('Abandonnée')
      expect(carte(/Récente/)).not.toHaveTextContent('Reprendre')
    })
    expect(screen.getAllByText('Reprendre')).toHaveLength(1)
  })

  it('un import dans les Réglages : l’Accueil rouvert montre les parties importées', async () => {
    const utilisateur = userEvent.setup()
    // La sauvegarde vient d'un autre téléphone, exportée comme en vrai.
    const ailleurs = await base()
    await ailleurs.x01Termine(le(OCT, 13, 20, 0), 'Venue d’ailleurs')
    const sauvegarde = await ailleurs.services.manageBackup.exportAll()

    const { services } = fakeServices({ clock: new SettableClock(MAINTENANT) })
    renderWithServices(<App />, {
      services,
      route: '/',
      queryClient: clientSansRevalidation(),
    })
    await screen.findByText('Aucune partie jouée pour l’instant')

    await utilisateur.click(screen.getByRole('link', { name: 'Réglages' }))
    const fichier = new File([JSON.stringify(sauvegarde)], 'dartpero.json', {
      type: 'application/json',
    })
    await utilisateur.upload(await screen.findByLabelText('Fichier de sauvegarde'), fichier)
    await screen.findByText(/sauvegarde restaurée/i)

    await utilisateur.click(screen.getByRole('link', { name: 'Début' }))

    expect(await screen.findByRole('heading', { name: 'Venue d’ailleurs' })).toBeVisible()
    expect(screen.queryByText('Aucune partie jouée pour l’instant')).not.toBeInTheDocument()
    expect(screen.queryByText('Pas de partie cette semaine')).not.toBeInTheDocument()
  })
})

describe('Accueil — mise à jour après les mutations', () => {
  /** Critère 9 : la suppression, depuis l'onglet Parties, rafraîchit « en cours » et l'historique. */
  it('supprimer la partie en cours fait passer l’abandonnée en cours, sans rechargement', async () => {
    const utilisateur = userEvent.setup()
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Ancienne')
    await enCours(le(OCT, 13, 20, 0), 'X01', 'Récente')

    ouvrir(services, '/historique')

    const ancienne = (await screen.findByRole('heading', { name: 'Ancienne' })).closest('li')
    expect(ancienne).toHaveTextContent('Abandonnée')
    const recente = (await screen.findByRole('heading', { name: 'Récente' })).closest('li')
    expect(recente).not.toHaveTextContent('Abandonnée')

    await utilisateur.click(
      within(recente as HTMLElement).getByRole('button', { name: 'Supprimer la partie' }),
    )
    await utilisateur.click(
      within(recente as HTMLElement).getByRole('button', {
        name: 'Confirmer la suppression de la partie',
      }),
    )

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Récente' })).toBeNull())
    // « Ancienne » devient la partie en cours : le statut est recalculé.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ancienne' }).closest('li')).not.toHaveTextContent(
        'Abandonnée',
      ),
    )
  })

  it('un lancement invalide l’historique de l’Accueil', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, kevin } = await base()
    dependencies.devices.preferences.write('partie:joueurs', [kevin])

    renderWithServices(
      <>
        <App />
        <SondeClient />
      </>,
      { services, route: '/' },
    )
    await screen.findByText('Aucune partie jouée pour l’instant')
    const cleAccueil = [...CLE_HISTORIQUE, 'accueil']
    expect(client?.getQueryState(cleAccueil)?.isInvalidated).toBe(false)
    expect(client?.getQueryState(CLE_MATCH_EN_COURS)?.isInvalidated).toBe(false)

    await utilisateur.click(screen.getByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    await utilisateur.click(await screen.findByRole('button', { name: 'Commencer' }))
    await screen.findByLabelText('Score restant de Kevin')

    expect(client?.getQueryState(cleAccueil)?.isInvalidated).toBe(true)
    expect(client?.getQueryState(CLE_MATCH_EN_COURS)?.isInvalidated).toBe(true)
  })

  /** Chargement à froid d'un nouvel Accueil — l'invalidation est prouvée plus haut, client partagé. */
  it('un Accueil rouvert à neuf (autre client) affiche la partie terminée entre-temps', async () => {
    const { services, x01Termine } = await base()
    const { unmount } = ouvrir(services)
    await screen.findByText('Aucune partie jouée pour l’instant')
    unmount()

    await x01Termine(le(OCT, 13, 21, 0), 'Tout juste finie')
    ouvrir(services)

    expect(await screen.findByRole('heading', { name: 'Tout juste finie' })).toBeVisible()
  })
})

describe('Historique — le même statut qu’à l’Accueil, même filtré par mode', () => {
  /** Critère 4. */
  it('X01 filtré : une partie abandonnée l’est aussi seule dans son filtre', async () => {
    const utilisateur = userEvent.setup()
    const { services, enCours } = await base()
    await enCours(le(OCT, 13, 18, 0), 'X01', 'Mon X01')
    await enCours(le(OCT, 13, 20, 0), 'CRICKET', 'Mon Cricket')

    // À l'Accueil.
    const { unmount } = ouvrir(services)
    await screen.findByRole('region', { name: 'Aujourd’hui' })
    expect(carte(/Mon X01/)).toHaveTextContent('Abandonnée')
    expect(carte(/Mon Cricket/)).not.toHaveTextContent('Abandonnée')
    unmount()

    // À l'Historique, sans filtre puis filtré : même verdict.
    ouvrir(services, '/historique')
    const x01 = async () => (await screen.findByRole('heading', { name: 'Mon X01' })).closest('li')
    expect(await x01()).toHaveTextContent('Abandonnée')

    await utilisateur.click(screen.getByRole('button', { name: 'X01' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Mon Cricket' })).toBeNull())
    expect(await x01()).toHaveTextContent('Abandonnée')
  })

  it('porte la carte commune : nom en titre, statut, un lien et sa suppression', async () => {
    const { services, x01Termine } = await base()
    const id = await x01Termine(le(OCT, 13, 20, 0), 'Finale')

    ouvrir(services, '/historique')

    const titre = await screen.findByRole('heading', { name: 'Finale', level: 2 })
    const li = titre.closest('li') as HTMLElement
    expect(within(li).getByRole('link')).toHaveAttribute('href', `/partie/${id}/resume`)
    expect(li).toHaveTextContent('Kevin gagne · 1 manche')
    expect(within(li).getByRole('button', { name: 'Supprimer la partie' })).toBeInTheDocument()
  })
})
