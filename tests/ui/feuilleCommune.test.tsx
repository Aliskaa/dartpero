import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { FeuilleMatch } from '@/ui/composants/commun/FeuilleMatch'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { couleurJoueur } from '@/ui/couleurs'
import {
  TITRE_BANDEAU_CRICKET,
  TITRE_BANDEAU_ENTRAINEMENT,
  TITRE_BANDEAU_TOUR_DU_MONDE,
} from '@/ui/labels'
import { fakeServices } from '../fakes'
import { flechette, flechetteDeSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const NOMS = ['Kevin', 'Julien', 'Marie'] as const

const creerJoueurs = async (services: Services, noms: readonly string[] = NOMS) => {
  const ids: PlayerId[] = []
  for (const nom of noms) ids.push((await services.managePlayers.create(nom)).id)
  return ids
}

type Jeu = {
  readonly nom: string
  readonly demarrer: (services: Services, joueurs: readonly PlayerId[]) => Promise<MatchId>
  readonly passerLaMain: (services: Services, matchId: MatchId) => Promise<void>
}

const JEUX: readonly Jeu[] = [
  {
    nom: 'X01',
    demarrer: (services, playerIds) =>
      services.startMatch.execute({ playerIds, config: X01Config.create() }),
    passerLaMain: async (services, matchId) => {
      await services.recordVisit.execute({
        matchId,
        darts: [Dart.single(1), Dart.single(1), Dart.single(1)],
      })
    },
  },
  {
    nom: 'Cricket',
    demarrer: (services, playerIds) =>
      services.playCricket.start({ playerIds, config: CricketConfig.create() }),
    passerLaMain: async (services, matchId) => {
      await services.playCricket.recordVisit(matchId, [Dart.miss(), Dart.miss(), Dart.miss()])
    },
  },
  {
    nom: 'Tour du monde',
    demarrer: (services, playerIds) =>
      services.playTourDuMonde.start({ playerIds, config: TourDuMondeConfig.create() }),
    passerLaMain: async (services, matchId) => {
      await services.playTourDuMonde.recordVisit(matchId, [Dart.miss(), Dart.miss(), Dart.miss()])
    },
  },
]

const ouvrir = async (jeu: Jeu, services: Services, passes = 0) => {
  const joueurs = await creerJoueurs(services)
  const matchId = await jeu.demarrer(services, joueurs)
  for (let i = 0; i < passes; i++) await jeu.passerLaMain(services, matchId)
  const vue = renderWithServices(<App />, { services, route: `/partie/${matchId}` })
  const feuille = await screen.findByRole('region', { name: 'Tableau des scores' })
  return { vue, feuille, matchId }
}

describe.each(JEUX)('$nom — la feuille commune', (jeu) => {
  it('un seul repère, qui glisse d’une ligne à l’autre ; aria-current sur le joueur qui lance', async () => {
    const { services } = fakeServices()
    const { feuille, vue } = await ouvrir(jeu, services, 1)

    const reperes = feuille.querySelectorAll('.repere-lancer')
    expect(reperes).toHaveLength(1)
    const repere = reperes[0] as HTMLElement
    expect(repere).toHaveAttribute('aria-hidden', 'true')
    expect(repere.style.transform).toBe('translateY(100%)')
    expect(parseFloat(repere.style.height)).toBeCloseTo(100 / 3, 1)

    const lignes = feuille.querySelectorAll('article')
    expect(lignes).toHaveLength(3)
    expect([...lignes].map((ligne) => ligne.hasAttribute('aria-current'))).toEqual([
      false,
      true,
      false,
    ])
    expect(lignes[1]).toHaveTextContent('Julien')
    vue.unmount()
  })

  it('le repère se place sur la première ligne au début de la partie', async () => {
    const { services } = fakeServices()
    const { feuille } = await ouvrir(jeu, services, 0)

    const repere = feuille.querySelector('.repere-lancer') as HTMLElement
    expect(repere.style.transform).toBe('translateY(0%)')
    expect(feuille.querySelectorAll('article')[0]).toHaveAttribute('aria-current', 'true')
  })

  it('un carré de couleur de 12 px devant chaque nom, jamais un liseré', async () => {
    const { services } = fakeServices()
    const { feuille } = await ouvrir(jeu, services, 0)

    const lignes = [...feuille.querySelectorAll('article')]
    expect(lignes).toHaveLength(3)
    for (const ligne of lignes) {
      const carre = ligne.querySelector('span.size-3[aria-hidden="true"]') as HTMLElement | null
      expect(carre, ligne.textContent ?? '').not.toBeNull()
      expect(carre?.style.backgroundColor).not.toBe('')
      expect(ligne.querySelector('.absolute.inset-y-0.left-0')).toBeNull()
    }
  })

  it('plus aucun `.au-lancer` : ni dans le rendu, ni dans la feuille de style', async () => {
    const { services } = fakeServices()
    await ouvrir(jeu, services, 0)

    expect(document.querySelector('.au-lancer')).toBeNull()
    const css = readFileSync(resolve(RACINE, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/\.au-lancer\b/)
    expect(css).toMatch(/\.repere-lancer\s*\{/)
  })
})

describe('FeuilleMatch — le repère', () => {
  const rendre = (indexActif: number | null) =>
    render(
      <FeuilleMatch
        grille="grid grid-cols-1"
        entetes={<span>E</span>}
        nbLignes={2}
        indexActif={indexActif}
      >
        <article>a</article>
        <article>b</article>
      </FeuilleMatch>,
    )

  it('absent quand personne ne lance (partie finie)', () => {
    const { container } = rendre(null)
    expect(container.querySelector('.repere-lancer')).toBeNull()
  })

  it('présent, et décalé d’une ligne par index', () => {
    const { container } = rendre(1)
    const repere = container.querySelector('.repere-lancer') as HTMLElement
    expect(repere.style.transform).toBe('translateY(100%)')
    expect(repere.style.height).toBe('50%')
  })

  it('les lignes ont une hauteur strictement égale : `repeat(n, 1fr)`', () => {
    const { container } = rendre(0)
    const grille = (container.querySelector('.repere-lancer') as HTMLElement)
      .parentElement as HTMLElement
    expect(grille.style.gridTemplateRows || (grille.getAttribute('style') ?? '')).toContain(
      'repeat(2, 1fr)',
    )
  })
})

describe('Cricket — la volée sur la dernière ligne', () => {
  const demarrer = async (services: Services) => {
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create(),
    })
    return matchId
  }

  it('avant la première fléchette du suivant : la volée du joueur précédent, avec son nom', async () => {
    const { services } = fakeServices()
    const matchId = await demarrer(services)
    await services.playCricket.recordVisit(matchId, [
      Dart.single(20),
      Dart.triple(19),
      Dart.double(18),
    ])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    const volee = await screen.findByLabelText('Volée de Kevin')
    expect(volee).toHaveTextContent('S20T19D18')
    expect(screen.getByLabelText('Points de Julien').closest('[aria-current]')).not.toBeNull()
    expect(volee.parentElement).toHaveTextContent('Volée')
    expect(volee.parentElement).toHaveTextContent('Kevin')
    expect(screen.queryByLabelText('Volée de Julien')).toBeNull()
  })

  it('dès la première fléchette du suivant : sa volée à lui', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const matchId = await demarrer(services)
    await services.playCricket.recordVisit(matchId, [Dart.single(20), Dart.miss(), Dart.miss()])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')

    await flechette(utilisateur, '19')

    const volee = await screen.findByLabelText('Volée de Julien')
    expect(volee).toHaveTextContent('S19——')
    expect(screen.queryByLabelText('Volée de Kevin')).toBeNull()
  })

  it('au début de la partie : le joueur qui va lancer, trois cases vides', async () => {
    const { services } = fakeServices()
    const matchId = await demarrer(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    const volee = await screen.findByLabelText('Volée de Kevin')
    expect(volee).toHaveTextContent(/^———$/)
  })

  it('les encoches au-dessus du pavé ont disparu', async () => {
    const { services } = fakeServices()
    const matchId = await demarrer(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')

    expect(screen.queryByLabelText('Volée en cours')).toBeNull()
    const pave = screen.getByRole('region', { name: 'Saisie des cibles touchées' })
    expect(pave.parentElement?.querySelector('output')).toBeNull()
  })
})

describe('Tour du monde — « Dernier tour » et la volée sur la ligne', () => {
  const COURT = TourDuMondeConfig.create({ targets: [20] })

  it('« Dernier tour » absent tant que personne n’a bouclé', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: COURT,
    })
    await services.playTourDuMonde.recordVisit(matchId, [Dart.miss(), Dart.miss(), Dart.miss()])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')

    expect(screen.queryByText('Dernier tour')).toBeNull()
  })

  it('« Dernier tour » présent, en badge sans fond, dès que quelqu’un a bouclé', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: COURT,
    })
    await services.playTourDuMonde.recordVisit(matchId, [Dart.single(20)])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    const badge = await screen.findByText('Dernier tour')
    expect(badge).toHaveClass('border', 'border-laiton/50', 'text-laiton-clair')
    expect(badge.className).not.toMatch(/\bbg-/)
  })

  it('la volée s’écrit sous le nom : la dernière du joueur, ou la volée en cours', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: TourDuMondeConfig.create({ targets: [20, 19, 'BULL'] }),
    })
    await services.playTourDuMonde.recordVisit(matchId, [Dart.single(20), Dart.miss(), Dart.miss()])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    expect(await screen.findByLabelText('Dernière volée de Kevin')).toHaveTextContent('2000')
    expect(screen.getByLabelText('Dernière volée de Julien')).toHaveTextContent('———')

    await utilisateur.click(screen.getByRole('button', { name: '20' }))
    expect(await screen.findByLabelText('Volée en cours')).toHaveTextContent('20——')
  })

  it.each([
    [2, 'text-score-xl-portrait'],
    [3, 'text-score-l-portrait'],
    [4, 'text-score-l-portrait'],
  ])(
    'à %i joueurs, la cible prend sa taille de planche (portrait), 3,25 rem en paysage',
    async (n, taille) => {
      const { services } = fakeServices()
      const joueurs = await creerJoueurs(services, ['Kevin', 'Julien', 'Marie', 'Paul'].slice(0, n))
      const matchId = await services.playTourDuMonde.start({
        playerIds: joueurs,
        config: TourDuMondeConfig.create(),
      })

      renderWithServices(<App />, { services, route: `/partie/${matchId}` })
      const cible = await screen.findByLabelText('Cible de Kevin')

      expect(cible).toHaveClass(taille, 'paysage:text-score-l')
      expect(cible).toHaveTextContent('20')
    },
  )

  it('la bulle : un glyphe plein et la légende « Bulle », pas un chiffre', async () => {
    const { services } = fakeServices()
    const [kevin] = await creerJoueurs(services, ['Kevin'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId],
      config: TourDuMondeConfig.create({ targets: ['BULL'] }),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    const cible = await screen.findByLabelText('Cible de Kevin')

    expect(cible).toHaveTextContent('Bulle')
    expect(cible.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })
})

describe('Bandeau Cricket — sous-titre et rappel de la condition, sans cadre', () => {
  const afficher = async (variant: 'STANDARD' | 'CUT_THROAT') => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create({ variant }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Points de Kevin')
  }

  it('standard : « Standard · 7 cibles » et « Ferme + mène »', async () => {
    await afficher('STANDARD')

    expect(screen.getByText('Standard · 7 cibles')).toBeInTheDocument()
    const droite = screen.getByText('Ferme + mène').parentElement as HTMLElement
    expect(droite).toHaveTextContent(/^Ferme \+ mène$/)
    expect(droite.className).not.toMatch(/\b(border|bg)-/)
    expect(droite.querySelector('[class*="border"], [class*="bg-"]')).toBeNull()
  })

  it('cut-throat : « Cut-throat · 7 cibles » et « Le plus bas / gagne » sur deux lignes, sans cadre rouge', async () => {
    await afficher('CUT_THROAT')

    expect(screen.getByText('Cut-throat · 7 cibles')).toBeInTheDocument()
    const droite = screen.getByText('Le plus bas').parentElement as HTMLElement
    expect(within(droite).getByText('gagne')).toBeInTheDocument()
    expect(droite).toHaveClass('flex-col', 'paysage:flex-row')
    expect(droite.className).not.toMatch(/\b(border|bg)-/)
    expect(droite.querySelector('[class*="border"], [class*="bg-"]')).toBeNull()
  })

  it('en cut-throat l’en-tête des points garde « Pts ↓ »', async () => {
    await afficher('CUT_THROAT')
    const feuille = screen.getByRole('region', { name: 'Tableau des scores' })
    expect(feuille.querySelector('.bandeau-feuille')).toHaveTextContent('Pts ↓')
  })

  it('pas de colonne de séparation entre les cibles : seulement avant la première et avant PTS', async () => {
    await afficher('STANDARD')
    const ligne = screen.getByLabelText('Points de Kevin').closest('article') as HTMLElement
    const colonnes = [...ligne.children] as HTMLElement[]
    expect(colonnes).toHaveLength(9)
    const filets = colonnes.map((colonne) => colonne.classList.contains('filet-colonne'))
    expect(filets).toEqual([false, true, false, false, false, false, false, false, true])
  })
})

describe('Bandeau Entraînement — sous-titre et « Manche N/total »', () => {
  it('dit les règles à gauche, la manche en cours à droite', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.playCheckoutPractice.start({
      playerId: kevin.id,
      config: CheckoutPracticeConfig.create({ rounds: 2 }),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    expect(await screen.findByText(/^2 checkouts · \d+ à \d+$/)).toBeInTheDocument()
    expect(screen.getByText('Manche 1/2')).toBeInTheDocument()

    for (const _ of [0, 1, 2]) await flechette(utilisateur, '1')
    await waitFor(() => expect(screen.getByText('Manche 2/2')).toBeInTheDocument())
  })
})

describe('Moment célébré — une rangée de 44 px', () => {
  it('le titre et le détail tiennent dans UNE rangée de 44 px, hors du flux', () => {
    render(
      <div className="relative">
        <MomentCelebratif moment={{ cle: 'a', titre: 'Fermée !', detail: '19' }} />
      </div>,
    )

    const moment = screen.getByRole('status')
    expect(moment).toHaveClass('absolute', 'bottom-0', 'pointer-events-none')
    expect(moment).toHaveAttribute('aria-live', 'polite')

    const rangee = moment.firstElementChild as HTMLElement
    expect(rangee).toHaveClass('h-11', 'flex', 'items-center')
    expect(within(rangee).getByText('Fermée !')).toBeInTheDocument()
    expect(within(rangee).getByText('19')).toBeInTheDocument()
    expect(within(rangee).getByText('Fermée !')).toHaveClass('shrink-0')
    expect(within(rangee).getByText('19')).toHaveClass('truncate')
  })

  it('par défaut sur le bas de la feuille ; `sous` : sous la feuille en portrait, sur son bas en paysage', () => {
    const { unmount } = render(
      <div className="relative">
        <MomentCelebratif moment={{ cle: 'c', titre: 'Checkout !' }} />
      </div>,
    )
    expect(screen.getByRole('status')).toHaveClass('bottom-0')
    expect(screen.getByRole('status')).not.toHaveClass('top-full')
    unmount()

    render(
      <div className="relative">
        <MomentCelebratif moment={{ cle: 'd', titre: 'Bouclé !' }} ancrage="sous" />
      </div>,
    )
    expect(screen.getByRole('status')).toHaveClass('top-full', 'paysage:bottom-0')
    expect(screen.getByRole('status')).not.toHaveClass('bottom-0')
  })

  it('au Tour du monde le moment se pose sous la feuille (portrait) : il ne masque pas la dernière ligne', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: TourDuMondeConfig.create({ targets: [20] }),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')
    await flechetteDeSortie(utilisateur, '20')

    const moment = (await screen.findByText('Bouclé !')).closest('[role="status"]')
    expect(moment).toHaveClass('top-full', 'absolute', 'pointer-events-none')
  })

  it('au Cricket et au X01 il recouvre le pied de la feuille (ligne de volée, ruban de checkout)', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create({ targets: [20, 19] }),
    })

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')
    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, 'Hors')
    await flechette(utilisateur, 'Hors')

    const moment = (await screen.findByText('Fermée !')).closest('[role="status"]')
    expect(moment).toHaveClass('bottom-0')
    expect(moment).not.toHaveClass('top-full')
  })

  it('sans détail : le titre seul, dans la même rangée', () => {
    render(
      <div className="relative">
        <MomentCelebratif moment={{ cle: 'b', titre: '180' }} />
      </div>,
    )

    const rangee = screen.getByRole('status').firstElementChild as HTMLElement
    expect(rangee).toHaveClass('h-11')
    expect(within(rangee).getByText('180')).toBeInTheDocument()
  })
})

describe.each(JEUX)('$nom — le carré porte la couleur du profil', (jeu) => {
  it('chaque carré est de la couleur de son joueur', async () => {
    const { services } = fakeServices()
    const couleurs = ['brique', 'sapin', 'lagon'] as const
    const joueurs: PlayerId[] = []
    for (const [rang, nom] of NOMS.entries()) {
      joueurs.push((await services.managePlayers.create(nom, couleurs[rang])).id)
    }
    const matchId = await jeu.demarrer(services, joueurs)
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    const feuille = await screen.findByRole('region', { name: 'Tableau des scores' })

    const normaliser = (couleur: string) => {
      const sonde = document.createElement('span')
      sonde.style.backgroundColor = couleur
      return sonde.style.backgroundColor
    }
    const carres = [...feuille.querySelectorAll('article')].map(
      (ligne) => (ligne.querySelector('span.size-3') as HTMLElement).style.backgroundColor,
    )
    expect(carres).toEqual(couleurs.map((couleur) => normaliser(couleurJoueur(couleur).fond)))
    expect(new Set(carres).size).toBe(3)
  })
})

describe('Cricket — cible morte', () => {
  it('quand les deux joueurs ont fermé le 20 : état « morte », colonne à 30 %, en-tête barré', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create(),
    })
    await services.playCricket.recordVisit(matchId, [Dart.triple(20), Dart.miss(), Dart.miss()])
    await services.playCricket.recordVisit(matchId, [Dart.triple(20), Dart.miss(), Dart.miss()])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    const feuille = await screen.findByRole('region', { name: 'Tableau des scores' })

    const etats = await screen.findAllByText('20 : cible morte')
    expect(etats).toHaveLength(2)
    for (const etat of etats) expect(etat.parentElement).toHaveClass('opacity-30')

    const entetes = [...(feuille.querySelector('.bandeau-feuille')?.children ?? [])]
    const entete20 = entetes.find((e) => e.textContent === '20') as HTMLElement
    expect(entete20).toHaveClass('line-through')
    const entete19 = entetes.find((e) => e.textContent === '19') as HTMLElement
    expect(entete19).not.toHaveClass('line-through')
    expect(screen.queryByText('19 : cible morte')).toBeNull()
  })

  it('fermée par un seul joueur : pas morte', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create(),
    })
    await services.playCricket.recordVisit(matchId, [Dart.triple(20), Dart.miss(), Dart.miss()])

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')

    expect(screen.queryByText('20 : cible morte')).toBeNull()
  })
})

describe('Cricket — la ligne VOLÉE : annulation, rejeu, joueur supprimé', () => {
  const VOLEE_KEVIN = [Dart.single(20), Dart.triple(19), Dart.double(18)]
  const VOLEE_JULIEN = [Dart.single(17), Dart.single(16), Dart.single(15)]

  const partie = async (services: Services) => {
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create(),
    })
    return { matchId, kevin: kevin as PlayerId, julien: julien as PlayerId }
  }

  it('annuler fléchette par fléchette : la volée se rouvre, puis la ligne revient à la volée d’avant', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partie(services)
    await services.playCricket.recordVisit(matchId, VOLEE_KEVIN)
    await services.playCricket.recordVisit(matchId, VOLEE_JULIEN)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    expect(await screen.findByLabelText('Volée de Julien')).toHaveTextContent('S17S16S15')

    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))
    await waitFor(() =>
      expect(screen.getByLabelText('Volée de Julien')).toHaveTextContent('S17S16—'),
    )
    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))
    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))

    expect(await screen.findByLabelText('Volée de Kevin')).toHaveTextContent('S20T19D18')
    expect(screen.queryByLabelText('Volée de Julien')).toBeNull()
  })

  it('annuler la 1ʳᵉ fléchette d’une volée : la ligne redonne la volée du joueur précédent', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partie(services)
    await services.playCricket.recordVisit(matchId, VOLEE_KEVIN)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')

    await flechette(utilisateur, '17')
    expect(await screen.findByLabelText('Volée de Julien')).toHaveTextContent('S17——')

    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))

    expect(await screen.findByLabelText('Volée de Kevin')).toHaveTextContent('S20T19D18')
    expect(screen.queryByLabelText('Volée de Julien')).toBeNull()
  })

  it('rejeu à froid : l’écran remonté depuis le dépôt dit la même chose, avant et après annulation', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = fakeServices()
    const { matchId } = await partie(services)
    await services.playCricket.recordVisit(matchId, VOLEE_KEVIN)
    await services.playCricket.recordVisit(matchId, VOLEE_JULIEN)

    const vue = renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Julien')
    vue.unmount()

    const remonte = renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    expect(await screen.findByLabelText('Volée de Julien')).toHaveTextContent('S17S16S15')

    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))
    await waitFor(() =>
      expect(screen.getByLabelText('Volée de Julien')).toHaveTextContent('S17S16—'),
    )
    await waitFor(async () =>
      expect((await dependencies.visitDrafts.findById(matchId))?.darts).toHaveLength(2),
    )
    remonte.unmount()

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    expect(await screen.findByLabelText('Volée de Julien')).toHaveTextContent('S17S16—')
  })

  it('joueur supprimé : la volée garde un nom de repli', async () => {
    const { services } = fakeServices()
    const { matchId, kevin } = await partie(services)
    await services.playCricket.recordVisit(matchId, VOLEE_KEVIN)
    await services.managePlayers.remove(kevin)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    const volee = await screen.findByLabelText('Volée de Joueur supprimé')
    expect(volee).toHaveTextContent('S20T19D18')
    expect(screen.queryByLabelText(/undefined|null/)).toBeNull()
  })
})

describe('Bandeau — le pictogramme du mode', () => {
  const pictogrammeDe = (titre: string) => {
    const bloc = screen.getByText(titre).parentElement as HTMLElement
    return bloc.previousElementSibling as SVGElement | null
  }

  const verifier = (titre: string) => {
    const svg = pictogrammeDe(titre)
    expect(svg, titre).not.toBeNull()
    expect(svg?.tagName.toLowerCase()).toBe('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg?.getAttribute('class') ?? '').not.toMatch(/lucide/)
    expect(svg?.querySelector('path, circle')).not.toBeNull()
  }

  it('Cricket', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playCricket.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: CricketConfig.create(),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Volée de Kevin')
    verifier(TITRE_BANDEAU_CRICKET)
  })

  it('Tour du monde', async () => {
    const { services } = fakeServices()
    const [kevin, julien] = await creerJoueurs(services, ['Kevin', 'Julien'])
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin as PlayerId, julien as PlayerId],
      config: TourDuMondeConfig.create(),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByLabelText('Cible de Kevin')
    verifier(TITRE_BANDEAU_TOUR_DU_MONDE)
  })

  it('Entraînement', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const matchId = await services.playCheckoutPractice.start({
      playerId: kevin.id,
      config: CheckoutPracticeConfig.create({ rounds: 2 }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await screen.findByText('Manche 1/2')
    verifier(TITRE_BANDEAU_ENTRAINEMENT)
  })
})
