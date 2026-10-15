import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { MatchStatus } from '@/core/application/use-cases/summarize'
import { vueCarte } from '@/ui/cartesPartie'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { CartePartie } from '@/ui/composants/commun/CartePartie'
import { FeuillePartie } from '@/ui/composants/commun/FeuillePartie'
import { MiniTableauPartie } from '@/ui/composants/commun/MiniTableauPartie'
import { JOUEUR_SUPPRIME } from '@/ui/labels'
import { resumeCricket, resumeEntrainement, resumeTourDuMonde, resumeX01 } from '../fakes/resumes'

describe('vueCarte — la colonne du mode : détail, unité, règles sans le nom du jeu', () => {
  it('X01 : « 501 », « reste », « 501 · premier à 2 manches » (ni double out ni double in)', () => {
    const vue = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 501 }], {
        config: { startingScore: 501, legsToWin: 2, doubleOut: true, doubleIn: true },
      }),
    )
    expect(vue.detail).toBe('501')
    expect(vue.unite).toBe('reste')
    expect(vue.regles).toBe('501 · premier à 2 manches')
    expect(vue.pictogramme).toBe('x01')
  })

  it('X01 à une manche et à sets', () => {
    expect(
      vueCarte(
        resumeX01([{ nom: 'Kevin', remaining: 301 }], {
          config: { startingScore: 301, legsToWin: 1 },
        }),
      ).regles,
    ).toBe('301 · 1 manche')
    expect(
      vueCarte(
        resumeX01([{ nom: 'Kevin', remaining: 501 }], { config: { legsToWin: 3, setsToWin: 2 } }),
      ).regles,
    ).toBe('501 · 2 sets · premier à 3 manches')
  })

  it('Cricket : « STD » / « CT », « pts », « Standard · 7 cibles »', () => {
    const standard = vueCarte(resumeCricket([{ nom: 'Kevin', score: 0 }]))
    expect(standard.detail).toBe('STD')
    expect(standard.unite).toBe('pts')
    expect(standard.regles).toBe('Standard · 7 cibles')
    const coupeGorge = vueCarte(
      resumeCricket([{ nom: 'Kevin', score: 0 }], { variant: 'CUT_THROAT' }),
    )
    expect(coupeGorge.detail).toBe('CT')
    expect(coupeGorge.regles).toBe('Cut-throat · 7 cibles')
  })

  it('Tour du monde : « 20→B », « fl. », « 20 → bulle »', () => {
    const vue = vueCarte(resumeTourDuMonde([{ nom: 'Kevin', targetIndex: 0 }]))
    expect(vue.detail).toBe('20→B')
    expect(vue.unite).toBe('fl.')
    expect(vue.regles).toBe('20 → bulle')
  })

  it('Tour du monde au parcours modifié : première → dernière cible, la bulle en « B » (R8)', () => {
    const montant = vueCarte(
      resumeTourDuMonde([{ nom: 'Kevin', targetIndex: 0 }], { targets: [1, 2, 20] }),
    )
    expect(montant.detail).toBe('1→20')
    const court = vueCarte(
      resumeTourDuMonde([{ nom: 'Kevin', targetIndex: 0 }], { targets: [20, 19, 'BULL'] }),
    )
    expect(court.detail).toBe('20→B')
  })

  it('entraînement : « 41-170 », « sorties », « 10 sorties · 41 à 170 »', () => {
    const vue = vueCarte(resumeEntrainement())
    expect(vue.detail).toBe('41-170')
    expect(vue.unite).toBe('sorties')
    expect(vue.regles).toBe('10 sorties · 41 à 170')
    expect(vue.pictogramme).toBe('entrainement')
  })
})

describe('vueCarte — les chiffres de la ligne', () => {
  it('X01 : le vainqueur n’a pas de chiffre (le « ✓ » le remplace), les autres leur reste', () => {
    const vue = vueCarte(
      resumeX01(
        [
          { nom: 'Julien', remaining: 87 },
          { nom: 'Kevin', remaining: 0 },
        ],
        { gagnant: 'Kevin' },
      ),
    )
    expect(vue.joueurs.map((j) => [j.nom, j.valeur, j.premier])).toEqual([
      ['Kevin', '', true],
      ['Julien', '87', false],
    ])
  })

  it('Cricket : les points, le premier de la partie finie en tête', () => {
    const vue = vueCarte(
      resumeCricket(
        [
          { nom: 'Kevin', score: 61 },
          { nom: 'Sarah', score: 86 },
        ],
        { gagnant: 'Sarah' },
      ),
    )
    expect(vue.joueurs.map((j) => [j.nom, j.valeur, j.premier])).toEqual([
      ['Sarah', '86', true],
      ['Kevin', '61', false],
    ])
  })

  it('Tour du monde : les fléchettes de ceux qui ont bouclé, « 19/21 » pour les autres', () => {
    const vue = vueCarte(
      resumeTourDuMonde(
        [
          { nom: 'Kevin', targetIndex: 19 },
          { nom: 'Julien', targetIndex: 21, finishedInDarts: 48 },
        ],
        { gagnant: 'Julien' },
      ),
    )
    expect(vue.joueurs.map((j) => j.valeur)).toEqual(['48', '19/21'])
  })

  it('entraînement : « réussies/jouées », jamais en tête même terminé (R6)', () => {
    const vue = vueCarte(resumeEntrainement({ finished: true, roundsWon: 7, roundsPlayed: 10 }))
    expect(vue.joueurs.map((j) => [j.valeur, j.premier])).toEqual([['7/10', false]])
  })

  it('une partie non finie : personne n’est en tête', () => {
    const vue = vueCarte(
      resumeCricket([
        { nom: 'Kevin', score: 61 },
        { nom: 'Sarah', score: 86 },
      ]),
    )
    expect(vue.joueurs.some((j) => j.premier)).toBe(false)
  })

  it('un match nul : tous les ex æquo en tête sont premiers (R7)', () => {
    const vue = vueCarte(
      resumeTourDuMonde(
        [
          { nom: 'Kevin', targetIndex: 21, finishedInDarts: 50 },
          { nom: 'Sarah', targetIndex: 21, finishedInDarts: 50 },
          { nom: 'Julien', targetIndex: 21, finishedInDarts: 60 },
        ],
        { finished: true },
      ),
    )
    expect(vue.joueurs.map((j) => [j.nom, j.premier])).toEqual([
      ['Kevin', true],
      ['Sarah', true],
      ['Julien', false],
    ])
  })

  it('un profil supprimé : « Joueur supprimé », classé comme les autres', () => {
    const vue = vueCarte(
      resumeCricket([
        { nom: 'Kevin', score: 10 },
        { nom: null, score: 30 },
      ]),
    )
    expect(vue.joueurs.map((j) => j.nom)).toEqual([JOUEUR_SUPPRIME, 'Kevin'])
  })
})

describe('vueCarte — l’état du mini tableau (R1-R4)', () => {
  it('X01 sans sets : « Manche N » sur toute la partie', () => {
    expect(vueCarte(resumeX01([{ nom: 'Kevin', remaining: 100 }], { legsPlayed: 2 })).etat).toBe(
      'Manche 3',
    )
  })

  it('X01 à sets : « Set S · manche N », tous sets confondus', () => {
    const partie = resumeX01(
      [
        { nom: 'Kevin', remaining: 81, legsWonInSet: 2, setsWon: 1 },
        { nom: 'Julien', remaining: 260, legsWonInSet: 1 },
      ],
      { legsPlayed: 3, config: { legsToWin: 3, setsToWin: 2 } },
    )
    expect(vueCarte(partie).etat).toBe('Set 2 · manche 4')
  })

  it('Cricket : « En cours », pas de numéro de volée', () => {
    expect(vueCarte(resumeCricket([{ nom: 'Kevin', score: 0 }])).etat).toBe('En cours')
  })

  it('Tour du monde : « En cours », puis « Dernier tour » dès que quelqu’un a bouclé', () => {
    expect(vueCarte(resumeTourDuMonde([{ nom: 'Kevin', targetIndex: 3 }])).etat).toBe('En cours')
    const dernier = resumeTourDuMonde([
      { nom: 'Kevin', targetIndex: 3 },
      { nom: 'Sarah', targetIndex: 21, finishedInDarts: 52 },
    ])
    expect(vueCarte(dernier).etat).toBe('Dernier tour')
  })

  it('entraînement : « Sortie N »', () => {
    expect(vueCarte(resumeEntrainement({ roundsPlayed: 7 })).etat).toBe('Sortie 8')
  })
})

describe('vueCarte — les jauges du mini tableau', () => {
  it('X01 : carrés de manches, traits de sets seulement avec des sets', () => {
    const sansSets = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 1, legsWonInSet: 1 }], { config: { legsToWin: 2 } }),
    ).joueurs[0]?.jauge
    expect(sansSets).toEqual({
      type: 'x01',
      manches: { pleins: 1, total: 2, carres: true },
      sets: null,
    })
    const avecSets = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 1, legsWonInSet: 2, setsWon: 1 }], {
        config: { legsToWin: 3, setsToWin: 2 },
      }),
    ).joueurs[0]?.jauge
    expect(avecSets).toEqual({
      type: 'x01',
      manches: { pleins: 2, total: 3, carres: true },
      sets: { pleins: 1, total: 2, carres: true },
    })
  })

  it('X01 : jusqu’à 5 carrés, au-delà un chiffre — manches comme sets (R5)', () => {
    const cinq = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 1 }], { config: { legsToWin: 5, setsToWin: 5 } }),
    )
    expect(cinq.joueurs[0]?.jauge).toMatchObject({
      manches: { total: 5, carres: true },
      sets: { total: 5, carres: true },
    })
    const dix = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 1 }], { config: { legsToWin: 10, setsToWin: 7 } }),
    )
    expect(dix.joueurs[0]?.jauge).toMatchObject({
      manches: { total: 10, carres: false },
      sets: { total: 7, carres: false },
    })
  })

  it('Cricket : les cibles fermées sur le total', () => {
    const vue = vueCarte(resumeCricket([{ nom: 'Kevin', score: 5, closedTargets: 4 }]))
    expect(vue.joueurs[0]?.jauge).toEqual({ type: 'cricket', fermees: 4, total: 7 })
  })

  it('Tour du monde : la barre d’avancée, pleine et « bouclée » une fois fini', () => {
    const vue = vueCarte(
      resumeTourDuMonde([
        { nom: 'Kevin', targetIndex: 14 },
        { nom: 'Sarah', targetIndex: 21, finishedInDarts: 52 },
      ]),
    )
    expect(vue.joueurs.map((j) => j.jauge)).toEqual([
      { type: 'barre', rempli: 21, total: 21, bouclee: true },
      { type: 'barre', rempli: 14, total: 21, bouclee: false },
    ])
    expect(vue.joueurs.map((j) => j.chiffre)).toEqual([
      { valeur: '52', petit: ' fl.' },
      { valeur: '14', petit: '/21' },
    ])
  })

  it('entraînement : les sorties réussies sur le nombre prévu', () => {
    const vue = vueCarte(resumeEntrainement({ roundsWon: 4, roundsPlayed: 7 }))
    expect(vue.joueurs[0]?.jauge).toEqual({ type: 'barre', rempli: 4, total: 10, bouclee: false })
    expect(vue.joueurs[0]?.chiffre).toEqual({ valeur: '4', petit: '/7' })
  })
})

describe('vueCarte — la phrase des lecteurs d’écran (R11)', () => {
  it('Cricket fini : « Sarah gagne, 86 points ; Kevin 61 ; Julien 22 »', () => {
    const vue = vueCarte(
      resumeCricket(
        [
          { nom: 'Julien', score: 22 },
          { nom: 'Sarah', score: 86 },
          { nom: 'Kevin', score: 61 },
        ],
        { gagnant: 'Sarah' },
      ),
    )
    expect(vue.phrase).toBe('Sarah gagne, 86 points ; Kevin 61 ; Julien 22')
  })

  it('X01 fini : « Kevin gagne en 3 manches ; Julien reste 87 ; Sarah 140 »', () => {
    const vue = vueCarte(
      resumeX01(
        [
          { nom: 'Kevin', remaining: 0 },
          { nom: 'Julien', remaining: 87 },
          { nom: 'Sarah', remaining: 140 },
        ],
        { gagnant: 'Kevin', legsPlayed: 3 },
      ),
    )
    expect(vue.phrase).toBe('Kevin gagne en 3 manches ; Julien reste 87 ; Sarah 140')
  })

  it('X01 fini en une manche : « en 1 manche » au singulier', () => {
    const vue = vueCarte(
      resumeX01([{ nom: 'Kevin', remaining: 0 }], { gagnant: 'Kevin', legsPlayed: 1 }),
    )
    expect(vue.phrase).toBe('Kevin gagne en 1 manche')
  })

  it('X01 en cours : pas de vainqueur, le reste de chacun', () => {
    const vue = vueCarte(
      resumeX01([
        { nom: 'Kevin', remaining: 144 },
        { nom: 'Sarah', remaining: 238 },
      ]),
    )
    expect(vue.phrase).toBe('Kevin reste 144 ; Sarah 238')
  })

  it('Tour du monde fini : fléchettes des bouclés, cibles des autres', () => {
    const vue = vueCarte(
      resumeTourDuMonde(
        [
          { nom: 'Kevin', targetIndex: 19 },
          { nom: 'Julien', targetIndex: 21, finishedInDarts: 48 },
          { nom: 'Sarah', targetIndex: 21, finishedInDarts: 55 },
        ],
        { gagnant: 'Julien' },
      ),
    )
    expect(vue.phrase).toBe('Julien gagne, 48 fléchettes ; Sarah 55 ; Kevin 19 cibles sur 21')
  })

  it('Tour du monde nul : « Match nul, … »', () => {
    const vue = vueCarte(
      resumeTourDuMonde(
        [
          { nom: 'Kevin', targetIndex: 21, finishedInDarts: 50 },
          { nom: 'Sarah', targetIndex: 21, finishedInDarts: 50 },
        ],
        { finished: true },
      ),
    )
    expect(vue.phrase).toBe('Match nul, Kevin 50 fléchettes ; Sarah 50')
  })

  it('Cricket fini sans vainqueur : « Terminée, … »', () => {
    const vue = vueCarte(
      resumeCricket(
        [
          { nom: 'Kevin', score: 40 },
          { nom: 'Sarah', score: 40 },
        ],
        { finished: true },
      ),
    )
    expect(vue.phrase).toBe('Terminée, Kevin 40 points ; Sarah 40')
  })

  it('entraînement : « Kevin 4 sorties réussies sur 7 »', () => {
    const vue = vueCarte(resumeEntrainement({ roundsWon: 4, roundsPlayed: 7 }))
    expect(vue.phrase).toBe('Kevin 4 sorties réussies sur 7')
  })

  it('le singulier s’accorde : « 1 point », « 1 sortie réussie sur 1 »', () => {
    expect(vueCarte(resumeCricket([{ nom: 'Kevin', score: 1 }])).phrase).toBe('Kevin 1 point')
    expect(vueCarte(resumeEntrainement({ roundsWon: 1, roundsPlayed: 1 })).phrase).toBe(
      'Kevin 1 sortie réussie sur 1',
    )
  })

  it('un profil supprimé est nommé « Joueur supprimé »', () => {
    const vue = vueCarte(resumeCricket([{ nom: null, score: 7 }]))
    expect(vue.phrase).toBe(`${JOUEUR_SUPPRIME} 7 points`)
  })
})

const profils = new Map()

const ligne = (
  partie: MatchSummary,
  options: { statut?: MatchStatus; actions?: boolean; marquerEnCours?: boolean } = {},
) =>
  render(
    <MemoryRouter>
      <FeuillePartie>
        <CartePartie
          partie={partie}
          statut={options.statut ?? (partie.finished ? 'FINISHED' : 'ABANDONED')}
          profils={profils}
          quand="21 h 05"
          marquerEnCours={options.marquerEnCours}
          actions={options.actions ? <button type="button">Supprimer</button> : undefined}
        />
      </FeuillePartie>
    </MemoryRouter>,
  )

describe('CartePartie — la ligne de feuille', () => {
  it('un nom tapé est le titre ; les règles disparaissent du titre', () => {
    ligne(resumeCricket([{ nom: 'Kevin', score: 1 }], { nom: 'Revanche du garage' }))
    expect(screen.getByRole('heading', { name: 'Revanche du garage' })).toBeVisible()
    expect(screen.queryByText('Standard · 7 cibles')).not.toBeInTheDocument()
  })

  it('sans nom tapé : les règles sans le nom du jeu, jamais « Mardi soir »', () => {
    ligne(resumeCricket([{ nom: 'Kevin', score: 1 }]))
    const titre = screen.getByRole('heading', { level: 2 })
    expect(titre).toHaveTextContent('Standard · 7 cibles')
    expect(titre).not.toHaveTextContent(/soir|matin|nuit|après-midi/i)
    expect(titre).not.toHaveTextContent(/^Cricket/)
  })

  it('la colonne du mode : détail et unité', () => {
    const { container } = ligne(resumeTourDuMonde([{ nom: 'Kevin', targetIndex: 3 }]))
    const colonne = container.querySelector('li a > span[aria-hidden="true"]')
    expect(colonne).toHaveTextContent('20→B')
    expect(colonne).toHaveTextContent('fl.')
  })

  it.each([1, 2, 3, 4])('%d joueur(s) : un avatar par joueur, classés', (nombre) => {
    const joueurs = ['Kevin', 'Sarah', 'Julien', 'Lucie']
      .slice(0, nombre)
      .map((nom, rang) => ({ nom, score: rang * 10 }))
    const { container } = ligne(resumeCricket(joueurs))
    const rangees = container.querySelectorAll('li a div > span[aria-hidden="true"]')
    expect(rangees).toHaveLength(nombre)
    // Le plus gros score d'abord.
    expect(rangees[0]).toHaveTextContent(String((nombre - 1) * 10))
  })

  it('à 4 joueurs : une grille 2 × 2 avec les noms ; à 3, une rangée sans noms', () => {
    const quatre = ligne(
      resumeCricket(
        ['Kevin', 'Sarah', 'Julien', 'Lucie'].map((nom, rang) => ({ nom, score: rang })),
      ),
    )
    expect(quatre.container.querySelector('.grid-cols-2')).not.toBeNull()
    expect(quatre.container.querySelector('li a div > span[aria-hidden="true"]')).toHaveTextContent(
      'Lucie',
    )
    quatre.unmount()

    const trois = ligne(
      resumeCricket(['Kevin', 'Sarah', 'Julien'].map((nom, rang) => ({ nom, score: rang }))),
    )
    expect(trois.container.querySelector('.grid-cols-2')).toBeNull()
    expect(
      trois.container.querySelector('li a div > span[aria-hidden="true"]'),
    ).not.toHaveTextContent('Sarah')
  })

  it('partie finie : le premier en laiton-clair avec un « ✓ », les autres sans', () => {
    const { container } = ligne(
      resumeCricket(
        [
          { nom: 'Sarah', score: 86 },
          { nom: 'Kevin', score: 61 },
        ],
        { gagnant: 'Sarah' },
      ),
    )
    const rangees = container.querySelectorAll('li a div > span[aria-hidden="true"]')
    expect(rangees[0]).toHaveClass('text-laiton-clair')
    expect(rangees[0]?.querySelector('svg.lucide-check')).not.toBeNull()
    expect(rangees[1]).not.toHaveClass('text-laiton-clair')
    expect(rangees[1]?.querySelector('svg.lucide-check')).toBeNull()
    expect(container.querySelector('li a')).toHaveAttribute(
      'href',
      expect.stringMatching(/\/resume$/),
    )
  })

  it('partie sans vainqueur : tous les ex æquo en tête portent le « ✓ » (R7)', () => {
    const { container } = ligne(
      resumeTourDuMonde(
        [
          { nom: 'Kevin', targetIndex: 21, finishedInDarts: 50 },
          { nom: 'Sarah', targetIndex: 21, finishedInDarts: 50 },
          { nom: 'Julien', targetIndex: 21, finishedInDarts: 60 },
        ],
        { finished: true },
      ),
    )
    expect(container.querySelectorAll('svg.lucide-check')).toHaveLength(2)
  })

  it('entraînement terminé : un seul joueur, « 7/10 », ni laiton ni « ✓ » (R6)', () => {
    const { container } = ligne(
      resumeEntrainement({ finished: true, roundsWon: 7, roundsPlayed: 10 }),
    )
    const rangee = container.querySelector('li a div > span[aria-hidden="true"]')
    expect(rangee).toHaveTextContent('7/10')
    expect(rangee).not.toHaveClass('text-laiton-clair')
    expect(container.querySelector('svg.lucide-check')).toBeNull()
  })

  it('« Abandonnée » et « En cours » : deux étiquettes, jamais « Reprendre »', () => {
    const abandonnee = ligne(resumeCricket([{ nom: 'Kevin', score: 1 }]), { statut: 'ABANDONED' })
    expect(screen.getByText('Abandonnée')).toBeVisible()
    expect(screen.queryByText('En cours')).not.toBeInTheDocument()
    abandonnee.unmount()

    const enCours = ligne(resumeCricket([{ nom: 'Kevin', score: 1 }]), {
      statut: 'ONGOING',
      marquerEnCours: true,
    })
    expect(screen.getByText('En cours')).toBeVisible()
    expect(screen.queryByText('Abandonnée')).not.toBeInTheDocument()
    expect(screen.queryByText('Reprendre')).not.toBeInTheDocument()
    enCours.unmount()

    // À l'Accueil, sans `marquerEnCours`, aucune étiquette.
    ligne(resumeCricket([{ nom: 'Kevin', score: 1 }]), { statut: 'ONGOING' })
    expect(screen.queryByText('En cours')).not.toBeInTheDocument()
  })

  it('entraînement sans sortie jouée : « — » sur la ligne, jamais « 0/0 »', () => {
    const { container } = ligne(resumeEntrainement())
    const rangee = container.querySelector('li a div > span[aria-hidden="true"]')
    expect(rangee).toHaveTextContent('—')
    expect(rangee).not.toHaveTextContent('0/0')
    expect(vueCarte(resumeEntrainement()).phrase).toBe('Kevin, aucune sortie jouée')
  })

  it('un profil supprimé : avatar neutre (teinte de bois), « Joueur supprimé » dans la phrase', () => {
    const { container } = ligne(resumeCricket([{ nom: null, score: 7 }]))
    const avatar = container.querySelector('li a [aria-hidden="true"] [style]') as HTMLElement
    const neutre = render(<Avatar nom={JOUEUR_SUPPRIME} couleur={null} taille="xs" />)
    expect(avatar.getAttribute('style')).toBe(
      (neutre.container.firstElementChild as HTMLElement).getAttribute('style'),
    )
    expect(screen.getByRole('link')).toHaveAccessibleName(expect.stringContaining(JOUEUR_SUPPRIME))
  })

  it('une seule cible : un lien, la corbeille est sa sœur et non son enfant', () => {
    ligne(resumeCricket([{ nom: 'Kevin', score: 1 }]), { actions: true })
    const li = screen.getByRole('listitem')
    const lien = within(li).getByRole('link')
    expect(within(li).getAllByRole('link')).toHaveLength(1)
    expect(within(lien).queryByRole('button')).toBeNull()
    expect(within(li).getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    expect(lien).toHaveClass('min-h-16')
  })

  it('le nom accessible du lien porte la phrase complète des lecteurs d’écran', () => {
    ligne(
      resumeCricket(
        [
          { nom: 'Sarah', score: 86 },
          { nom: 'Kevin', score: 61 },
          { nom: 'Julien', score: 22 },
        ],
        { gagnant: 'Sarah' },
      ),
    )
    expect(screen.getByRole('link')).toHaveAccessibleName(
      expect.stringContaining('Sarah gagne, 86 points ; Kevin 61 ; Julien 22'),
    )
  })
})

const mini = (partie: MatchSummary) =>
  render(
    <MemoryRouter>
      <ul>
        <MiniTableauPartie partie={partie} profils={profils} quand="21 h 40" />
      </ul>
    </MemoryRouter>,
  )

describe('MiniTableauPartie — la partie en cours', () => {
  it('X01 : le titre est le nom du jeu sans nom tapé, les règles dessous, l’état à droite', () => {
    mini(
      resumeX01(
        [
          { nom: 'Kevin', remaining: 144, legsWonInSet: 1 },
          { nom: 'Sarah', remaining: 238, legsWonInSet: 1 },
          { nom: 'Julien', remaining: 355 },
        ],
        { legsPlayed: 2 },
      ),
    )
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('X01')
    expect(screen.getByText('501 · premier à 2 manches')).toBeVisible()
    expect(screen.getByText('Manche 3')).toBeVisible()
    expect(screen.getByText('21 h 40')).toBeVisible()
  })

  it('un nom tapé est le titre', () => {
    mini(resumeCricket([{ nom: 'Kevin', score: 1 }], { nom: 'Belote du jeudi' }))
    expect(screen.getByRole('heading', { name: 'Belote du jeudi' })).toBeVisible()
  })

  it('une ligne par joueur, classée, la première teintée de laiton', () => {
    const { container } = mini(
      resumeCricket([
        { nom: 'Julien', score: 15 },
        { nom: 'Kevin', score: 40 },
        { nom: 'Sarah', score: 75 },
        { nom: 'Lucie', score: 20 },
      ]),
    )
    const rangs = container.querySelectorAll('[aria-hidden="true"] > div')
    expect(rangs).toHaveLength(4)
    expect(rangs[0]).toHaveTextContent('Sarah')
    expect(rangs[0]).toHaveClass('bg-laiton/12')
    expect(rangs[1]).not.toHaveClass('bg-laiton/12')
    expect(rangs[3]).toHaveTextContent('Julien')
  })

  it('égalité en tête : tous les ex æquo ont le fond teinté et le chiffre laiton-clair', () => {
    const { container } = mini(
      resumeCricket([
        { nom: 'Kevin', score: 40, closedTargets: 3 },
        { nom: 'Sarah', score: 40, closedTargets: 3 },
        { nom: 'Julien', score: 10 },
      ]),
    )
    const rangs = Array.from(container.querySelectorAll('[aria-hidden="true"] > div'))
    expect(rangs.map((r) => r.classList.contains('bg-laiton/12'))).toEqual([true, true, false])
    expect(
      rangs.map((r) => r.querySelector('.chiffres')?.classList.contains('text-laiton-clair')),
    ).toEqual([true, true, false])
  })

  it('départ, tous à égalité : aucune ligne n’est teintée', () => {
    const { container } = mini(
      resumeX01(['Kevin', 'Sarah', 'Julien'].map((nom) => ({ nom, remaining: 501 }))),
    )
    expect(container.querySelectorAll('.bg-laiton\\/12')).toHaveLength(0)
    expect(container.querySelectorAll('.text-laiton-clair.chiffres')).toHaveLength(0)
  })

  it('entraînement sans sortie jouée : « — » à la place de « 0/0 »', () => {
    const { container } = mini(resumeEntrainement())
    const rang = container.querySelector('[aria-hidden="true"] > div') as HTMLElement
    expect(rang).toHaveTextContent('—')
    expect(rang).not.toHaveTextContent('0/0')
    expect(screen.getByRole('link')).toHaveAccessibleName(
      expect.stringContaining('Kevin, aucune sortie jouée'),
    )
  })

  it('un seul joueur (entraînement, même avancé) : aucune ligne teintée', () => {
    const { container } = mini(resumeEntrainement({ roundsWon: 4, roundsPlayed: 7 }))
    expect(container.querySelectorAll('.bg-laiton\\/12')).toHaveLength(0)
    expect(container.querySelectorAll('.text-laiton-clair.chiffres')).toHaveLength(0)
  })

  it('à 4 joueurs : les quatre lignes sont gardées, resserrées', () => {
    const { container } = mini(
      resumeX01(
        ['Kevin', 'Sarah', 'Lucie', 'Julien'].map((nom, rang) => ({ nom, remaining: 100 + rang })),
      ),
    )
    const rangs = container.querySelectorAll('[aria-hidden="true"] > div')
    expect(rangs).toHaveLength(4)
    expect(rangs[0]).toHaveClass('py-[3px]')
  })

  it('X01 : carrés des manches, pleins = manches du set ; traits de sets avec des sets', () => {
    const { container } = mini(
      resumeX01(
        [
          { nom: 'Kevin', remaining: 81, legsWonInSet: 2, setsWon: 1 },
          { nom: 'Julien', remaining: 260, legsWonInSet: 1 },
        ],
        { legsPlayed: 3, config: { legsToWin: 3, setsToWin: 2 } },
      ),
    )
    expect(screen.getByText('Set 2 · manche 4')).toBeVisible()
    const premiere = container.querySelector('[aria-hidden="true"] > div') as HTMLElement
    expect(premiere.querySelectorAll('i')).toHaveLength(5) // 3 manches + 2 sets
    expect(premiere.querySelectorAll('i.bg-laiton')).toHaveLength(3) // 2 manches + 1 set
    expect(premiere).toHaveTextContent('81')
  })

  it('X01 au-delà de 5 manches : « 3/10 » à la place des carrés (R5)', () => {
    const { container } = mini(
      resumeX01([{ nom: 'Kevin', remaining: 81, legsWonInSet: 3 }], { config: { legsToWin: 10 } }),
    )
    const rang = container.querySelector('[aria-hidden="true"] > div') as HTMLElement
    expect(rang.querySelectorAll('i')).toHaveLength(0)
    expect(rang).toHaveTextContent('3/10')
  })

  it('Cricket : une case par cible, pleines pour les fermées ; chiffre = points', () => {
    const { container } = mini(
      resumeCricket([{ nom: 'Kevin', score: 40, closedTargets: 6 }], { variant: 'CUT_THROAT' }),
    )
    const rang = container.querySelector('[aria-hidden="true"] > div') as HTMLElement
    expect(rang.querySelectorAll('i')).toHaveLength(7)
    expect(rang.querySelectorAll('i.bg-craie')).toHaveLength(6)
    expect(rang).toHaveTextContent('40')
  })

  it('Tour du monde : barre laiton « 14/21 », verte et en fléchettes une fois bouclé', () => {
    const { container } = mini(
      resumeTourDuMonde([
        { nom: 'Kevin', targetIndex: 14 },
        { nom: 'Sarah', targetIndex: 21, finishedInDarts: 52 },
      ]),
    )
    expect(screen.getByText('Dernier tour')).toBeVisible()
    const [sarah, kevin] = Array.from(
      container.querySelectorAll('[aria-hidden="true"] > div'),
    ) as HTMLElement[]
    expect(sarah).toHaveTextContent('52 fl.')
    expect(sarah?.querySelector('i')).toHaveClass('bg-vert-cible')
    expect(sarah?.querySelector('i')).toHaveStyle({ width: '100%' })
    expect(kevin).toHaveTextContent('14/21')
    expect(kevin?.querySelector('i')).toHaveClass('bg-laiton')
  })

  it('entraînement : barre des sorties réussies sur le nombre prévu, « 4/7 », « Sortie 8 »', () => {
    const { container } = mini(resumeEntrainement({ roundsWon: 4, roundsPlayed: 7 }))
    expect(screen.getByText('Sortie 8')).toBeVisible()
    const rang = container.querySelector('[aria-hidden="true"] > div') as HTMLElement
    expect(rang).toHaveTextContent('4/7')
    expect(rang.querySelector('i')).toHaveStyle({ width: '40%' })
  })

  it('« Reprendre » : une seule cible, celle de toute la carte', () => {
    mini(resumeCricket([{ nom: 'Kevin', score: 1 }], { id: 'en-cours' }))
    const lien = screen.getByRole('link')
    expect(lien).toHaveAttribute('href', '/partie/en-cours')
    expect(lien).toHaveTextContent('Reprendre')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('la phrase complète est lue par les lecteurs d’écran', () => {
    mini(
      resumeX01([
        { nom: 'Kevin', remaining: 144 },
        { nom: 'Sarah', remaining: 238 },
      ]),
    )
    expect(screen.getByRole('link')).toHaveAccessibleName(
      expect.stringContaining('Kevin reste 144 ; Sarah 238'),
    )
  })
})
