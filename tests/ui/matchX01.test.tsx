import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config, type X01ConfigInput } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { Batons } from '@/ui/composants/commun/Batons'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { libelleSetEnCours, sousTitreBandeauX01, TITRE_BANDEAU_X01 } from '@/ui/labels'
import { DepotSuspendu, fakeServices } from '../fakes'
import { flechette, flechetteDeSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

// ⚠️ jsdom ne mesure rien : on vérifie les ÉTATS (attributs, classes, ordre du DOM), pas les dimensions.

const partie = async (config: X01ConfigInput = {}, services?: Services) => {
  const svc = services ?? fakeServices().services
  const kevin = await svc.managePlayers.create('Kevin')
  const julien = await svc.managePlayers.create('Julien')
  const matchId = await svc.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create(config),
  })
  return { services: svc, matchId }
}

const afficher = async (config: X01ConfigInput = {}, services?: Services) => {
  const lancee = await partie(config, services)
  renderWithServices(<App />, { services: lancee.services, route: `/partie/${lancee.matchId}` })
  await screen.findByLabelText('Score restant de Kevin')
  return lancee
}

const pave = () => screen.getByRole('region', { name: 'Saisie fléchette par fléchette' })
const scoreDe = (nom: string) => screen.getByLabelText(`Score restant de ${nom}`)

const MULTIPLICATEURS = [
  ['Simple', 'simple'],
  ['Double', 'double'],
  ['Triple', 'triple'],
] as const

describe('Pavé X01 — le multiplicateur armé', () => {
  it.each(MULTIPLICATEURS)(
    '%s armé : la section du pavé porte data-multiplicateur="%s"',
    async (bouton, attendu) => {
      const utilisateur = userEvent.setup()
      await afficher()

      await utilisateur.click(screen.getByRole('button', { name: bouton }))

      expect(pave()).toHaveAttribute('data-multiplicateur', attendu)
    },
  )

  it.each(MULTIPLICATEURS)(
    '%s armé : touche-armee sur les 21 touches de score, jamais sur « Hors » ni « Annuler »',
    async (bouton) => {
      const utilisateur = userEvent.setup()
      await afficher()
      await utilisateur.click(screen.getByRole('button', { name: bouton }))

      const touches = within(pave()).getAllByRole('button')
      const armees = touches.filter((touche) => touche.classList.contains('touche-armee'))

      expect(armees).toHaveLength(21)
      for (const nom of [...Array.from({ length: 20 }, (_, rang) => String(rang + 1)), 'Bulle']) {
        expect(screen.getByRole('button', { name: nom })).toHaveClass('touche-armee')
      }
      expect(screen.getByRole('button', { name: 'Hors' })).not.toHaveClass('touche-armee')
      expect(screen.getByRole('button', { name: 'Annuler' })).not.toHaveClass('touche-armee')
      expect(screen.getByRole('button', { name: bouton })).not.toHaveClass('touche-armee')
    },
  )

  it('retombe sur simple après la fléchette : l’attribut suit, le filet peut fondre', async () => {
    const utilisateur = userEvent.setup()
    await afficher()

    await flechette(utilisateur, '20', 'Triple')

    expect(pave()).toHaveAttribute('data-multiplicateur', 'simple')
  })

  it('la Bulle reste désactivée en Triple : une règle, pas un état de chargement', async () => {
    const utilisateur = userEvent.setup()
    await afficher()

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))

    expect(screen.getByRole('button', { name: 'Bulle' })).toBeDisabled()
  })

  it('l’exposant annonce la valeur réelle : rien en Simple, 2× en Double, 3× en Triple, 25 puis 50 sur la Bulle', async () => {
    const utilisateur = userEvent.setup()
    await afficher()
    const exposant = (nom: string) =>
      screen.getByRole('button', { name: nom }).querySelector('[aria-hidden="true"]')?.textContent

    expect(exposant('20')).toBeUndefined()
    expect(exposant('Bulle')).toBe('25')
    expect(screen.getByRole('button', { name: 'Bulle' }).querySelector('span')).toHaveClass(
      'exposant-touche-neutre',
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Double' }))
    expect(exposant('20')).toBe('40')
    expect(exposant('1')).toBe('2')
    expect(exposant('Bulle')).toBe('50')
    expect(screen.getByRole('button', { name: 'Bulle' }).querySelector('span')).toHaveClass(
      'exposant-touche',
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    expect(exposant('20')).toBe('60')
    expect(exposant('1')).toBe('3')
    expect(exposant('Bulle')).toBeUndefined()

    await utilisateur.click(screen.getByRole('button', { name: 'Simple' }))
    expect(exposant('20')).toBeUndefined()
  })
})

describe('Pavé X01 — fin du clignotement', () => {
  it('aucune touche n’est désactivée pendant l’écriture, et un appui n’enregistre rien', async () => {
    const utilisateur = userEvent.setup()
    const depot = new DepotSuspendu()
    const { services } = fakeServices({ matches: depot })
    await afficher({}, services)

    depot.suspendre()
    depot.ecritures = 0

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '20')
    await flechette(utilisateur, '20')
    await waitFor(() => expect(depot.ecritures).toBe(1))

    const eteintes = within(pave())
      .getAllByRole('button')
      .filter((touche) => touche.hasAttribute('disabled'))
    expect(eteintes).toEqual([])

    await utilisateur.click(screen.getByRole('button', { name: '1' }))
    expect(depot.ecritures).toBe(1)

    await act(async () => {
      depot.liberer()
    })
    await waitFor(() => expect(scoreDe('Kevin')).toHaveTextContent('441'))
    expect(scoreDe('Julien')).toHaveTextContent('501')
    expect(depot.ecritures).toBe(1)
  })
})

describe('Moment célébré — hors du flux', () => {
  it('se superpose au bas du tableau sans entrer dans le tableau ni dans le pavé', async () => {
    const utilisateur = userEvent.setup()
    await afficher({ startingScore: 40, legsToWin: 2 })

    await flechetteDeSortie(utilisateur, '20', 'Double') // Kevin sort : manche gagnée
    const moment = (await screen.findByText('Manche !')).closest('[role="status"]')
    expect(moment).not.toBeNull()
    if (!moment) return

    expect(moment).toHaveClass('absolute', 'pointer-events-none')
    expect(moment).toHaveAttribute('aria-live', 'polite')

    const tableau = screen.getByRole('region', { name: 'Tableau des scores' })
    const enveloppe = moment.parentElement
    expect(enveloppe).toHaveClass('relative')
    expect(enveloppe?.contains(tableau)).toBe(true)
    expect(enveloppe?.lastElementChild).toBe(moment)
    expect(tableau.contains(moment)).toBe(false)
    expect(enveloppe?.contains(pave())).toBe(false)
  })
})

describe('Bâtons — les manches restantes en tirets', () => {
  it('trace en tirets ce qui reste à gagner, y compris le trait barré, et en plein ce qui est acquis', () => {
    const { container } = render(<Batons gagnes={1} requis={6} libelle="Manches" />)

    const acquis = container.querySelectorAll('.bg-craie')
    const restants = container.querySelectorAll('.border-dashed')

    expect(acquis).toHaveLength(1)
    expect(restants).toHaveLength(5)
    expect(container.querySelectorAll('.border-l-2')).toHaveLength(4)
    expect(container.querySelectorAll('.border-t-2')).toHaveLength(1)
    for (const trait of acquis) expect(trait).not.toHaveClass('border-dashed')
    expect(container.querySelector('[class*="bg-craie/25"]')).toBeNull()
  })

  it('un compte complet n’a plus aucun tiret, trait barré compris', () => {
    const { container } = render(<Batons gagnes={5} requis={5} libelle="Manches" />)

    expect(container.querySelectorAll('.bg-craie')).toHaveLength(5)
    expect(container.querySelectorAll('.border-dashed')).toHaveLength(0)
  })
})

describe('Bandeau X01', () => {
  it('dit le jeu par son pictogramme (24 px, décoratif) et son titre, la manche à droite', async () => {
    await afficher({ startingScore: 501, legsToWin: 2 })

    const bandeau = screen.getByRole('banner')
    const picto = bandeau.querySelector('svg:not(.lucide)[width="24"]')
    expect(picto).not.toBeNull()
    expect(picto).toHaveAttribute('aria-hidden', 'true')

    expect(within(bandeau).getByText(TITRE_BANDEAU_X01)).toBeInTheDocument()
    expect(within(bandeau).getByText('501 · premier à 2 manches')).toBeInTheDocument()
    expect(within(bandeau).getByText('Manche 1')).toBeInTheDocument()
    expect(within(bandeau).queryByText(/^Set /)).not.toBeInTheDocument()
  })

  it('« Set M » ne s’affiche que s’il y a des sets, avec DI et DO', async () => {
    await afficher({ setsToWin: 2, doubleIn: true, doubleOut: true })

    const bandeau = screen.getByRole('banner')
    expect(within(bandeau).getByText('Set 1')).toBeInTheDocument()
    expect(within(bandeau).getByText('DI')).toBeInTheDocument()
    expect(within(bandeau).getByText('DO')).toBeInTheDocument()
  })

  it('« Manche N » est en craie : le laiton reste au repère et au rail', async () => {
    await afficher()

    const manche = screen.getByText('Manche 1')
    expect(manche.parentElement).toHaveClass('text-craie-2')
    expect(manche.parentElement).not.toHaveClass('text-laiton-clair')
  })

  it('les libellés viennent de labels.ts', () => {
    expect(TITRE_BANDEAU_X01).toBe('X01')
    expect(sousTitreBandeauX01(301, 3)).toBe('301 · premier à 3 manches')
    expect(sousTitreBandeauX01(701, 1)).toBe('701 · 1 manche')
    expect(libelleSetEnCours(2)).toBe('Set 2')
  })
})

describe('Tableau X01 — le repère qui glisse', () => {
  const repere = () => document.querySelector('.repere-lancer') as HTMLElement | null

  it('un seul repère décoratif, calé sur la ligne du joueur qui lance', async () => {
    await afficher()

    expect(document.querySelectorAll('.repere-lancer')).toHaveLength(1)
    expect(repere()).toHaveAttribute('aria-hidden', 'true')
    expect(repere()?.style.height).toBe('50%')
    expect(repere()?.style.transform).toBe('translateY(0%)')
    expect(scoreDe('Kevin').closest('[aria-current]')).not.toBeNull()
  })

  it('glisse vers la ligne suivante quand la main passe', async () => {
    const utilisateur = userEvent.setup()
    await afficher()

    await flechette(utilisateur, '20')
    await flechette(utilisateur, '20')
    await flechette(utilisateur, '20')

    await waitFor(() => expect(repere()?.style.transform).toBe('translateY(100%)'))
    expect(scoreDe('Julien').closest('[aria-current]')).not.toBeNull()
    expect(document.querySelectorAll('.repere-lancer')).toHaveLength(1)
  })
})

describe('Ligne X01 — le reste', () => {
  it('seul le reste du joueur qui lance est en craie vive', async () => {
    await afficher()

    expect(scoreDe('Kevin')).toHaveClass('text-craie-vive')
    expect(scoreDe('Julien')).toHaveClass('text-craie')
    expect(scoreDe('Julien')).not.toHaveClass('text-craie-vive')
  })

  it('est plus grand en portrait, et garde sa taille d’avant en paysage', async () => {
    await afficher()

    expect(scoreDe('Kevin')).toHaveClass('text-score-xl-portrait', 'paysage:text-score-xl')
  })

  it('donne 8,25 rem au reste en portrait, 6,75 rem en paysage, ligne et en-tête alignés', async () => {
    await afficher()

    const portrait = 'grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_8.25rem]'
    const paysage = 'paysage:grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]'
    const ligne = scoreDe('Kevin').closest('article')
    const entete = document.querySelector('.bandeau-feuille')
    expect(ligne).toHaveClass(portrait, paysage)
    expect(entete).toHaveClass(portrait, paysage)
  })

  it('serre les trois cases de fléchettes à gap-1 (« BULL » ne doit pas être rogné)', async () => {
    await afficher()

    const sorties = screen.getAllByLabelText(/^(Volée en cours|Dernière volée de )/)
    expect(sorties.length).toBeGreaterThanOrEqual(2)
    for (const sortie of sorties) {
      expect(sortie).toHaveClass('gap-1')
      expect(sortie).not.toHaveClass('gap-1.5')
    }
  })
})

describe('Disposition commune — lecture en haut, nom masqué en paysage', () => {
  it('ne centre plus la zone de lecture, et masque la ligne du nom en paysage', () => {
    render(
      <DispositionPartie enTete={<span>bandeau</span>} nomPartie="Finale" saisie={null}>
        <p>lecture</p>
      </DispositionPartie>,
    )

    expect(screen.getByText('lecture').parentElement).not.toHaveClass('justify-center')
    expect(screen.getByText('Finale')).toHaveClass('paysage:hidden')
  })
})

type ModeCible = {
  readonly nom: string
  readonly demarrer: (
    services: Services,
    joueurs: readonly [PlayerId, PlayerId],
  ) => Promise<MatchId>
  readonly enregistrees: (services: Services, matchId: MatchId) => Promise<number>
  readonly voleeComplete: readonly string[]
  readonly provoquer: (utilisateur: ReturnType<typeof userEvent.setup>) => Promise<void>
  readonly titreMoment: string
  readonly touche: string
  readonly voleeEcrite: { readonly etiquette: string; readonly texte: string }
}

const MODES_CIBLES: readonly ModeCible[] = [
  {
    nom: 'Cricket',
    demarrer: (services, [a, b]) =>
      services.playCricket.start({
        playerIds: [a, b],
        config: CricketConfig.create({ targets: [20, 19] }),
      }),
    enregistrees: async (services, matchId) =>
      (await services.playCricket.getState(matchId)).history.length,
    voleeComplete: ['20', '20', '20'],
    provoquer: async (utilisateur) => {
      await flechette(utilisateur, '20', 'Triple')
      await flechette(utilisateur, 'Hors')
      await flechette(utilisateur, 'Hors')
    },
    titreMoment: 'Fermée !',
    touche: '19',
    voleeEcrite: { etiquette: 'Volée de Kevin', texte: 'S20S20S20' },
  },
  {
    nom: 'Tour du monde',
    demarrer: (services, [a, b]) =>
      services.playTourDuMonde.start({
        playerIds: [a, b],
        config: TourDuMondeConfig.create({ targets: [20, 19] }),
      }),
    enregistrees: async (services, matchId) =>
      (await services.playTourDuMonde.getState(matchId)).history.length,
    voleeComplete: ['20', '20', '20'],
    provoquer: async (utilisateur) => {
      await flechette(utilisateur, '20')
      await flechetteDeSortie(utilisateur, '19')
    },
    titreMoment: 'Bouclé !',
    touche: '1',
    voleeEcrite: { etiquette: 'Dernière volée de Kevin', texte: '202020' },
  },
]

const afficherMode = async (mode: ModeCible, services: Services) => {
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')
  const matchId = await mode.demarrer(services, [kevin.id, julien.id])
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })
  const region = await screen.findByRole('region', { name: 'Saisie des cibles touchées' })
  return { matchId, region }
}

describe.each(MODES_CIBLES)('$nom — le pavé ne se grise pas pendant l’écriture', (mode) => {
  it('aucune touche désactivée pendant l’écriture, et un appui n’enregistre rien', async () => {
    const utilisateur = userEvent.setup()
    const depot = new DepotSuspendu()
    const { services } = fakeServices({ matches: depot })
    const { matchId, region } = await afficherMode(mode, services)

    depot.suspendre()
    depot.ecritures = 0

    for (const cible of mode.voleeComplete) await flechette(utilisateur, cible)
    await waitFor(() => expect(depot.ecritures).toBe(1))

    const eteintes = within(region)
      .getAllByRole('button')
      .filter((touche) => touche.hasAttribute('disabled'))
    expect(eteintes).toEqual([])

    await utilisateur.click(within(region).getByRole('button', { name: mode.touche }))
    expect(depot.ecritures).toBe(1)

    await act(async () => {
      depot.liberer()
    })
    await waitFor(async () => expect(await mode.enregistrees(services, matchId)).toBe(1))
    expect(depot.ecritures).toBe(1)
    await waitFor(() =>
      expect(screen.getByLabelText(mode.voleeEcrite.etiquette)).toHaveTextContent(
        mode.voleeEcrite.texte,
      ),
    )
    expect(screen.queryByLabelText('Volée en cours')).toBeNull()
  })
})

describe.each(MODES_CIBLES)('$nom — moment célébré hors du flux', (mode) => {
  it('se superpose au bas du tableau sans entrer dans le tableau ni dans le pavé', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { region } = await afficherMode(mode, services)

    await mode.provoquer(utilisateur)
    const moment = (await screen.findByText(mode.titreMoment)).closest('[role="status"]')
    expect(moment).not.toBeNull()
    if (!moment) return

    expect(moment).toHaveClass('absolute', 'pointer-events-none')
    expect(moment).toHaveAttribute('aria-live', 'polite')

    const tableau = screen.getByRole('region', { name: 'Tableau des scores' })
    const enveloppe = moment.parentElement
    expect(enveloppe).toHaveClass('relative')
    expect(enveloppe?.contains(tableau)).toBe(true)
    expect(enveloppe?.lastElementChild).toBe(moment)
    expect(tableau.contains(moment)).toBe(false)
    expect(enveloppe?.contains(region)).toBe(false)
  })
})
