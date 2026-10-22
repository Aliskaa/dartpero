import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { Dart, type Multiplier } from '@/core/domain/value-objects/Dart'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { PaveCricket } from '@/ui/composants/cricket/PaveCricket'
import { PaveCibles } from '@/ui/composants/tour-du-monde/PaveCibles'
import { PaveFlechettes } from '@/ui/composants/x01/PaveFlechettes'
import { libelleFlechetteTourDuMonde } from '@/ui/labels'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

// ⚠️ jsdom ne mesure rien : on vérifie les fléchettes reçues, les états et l'ordre du DOM.

const enregistreur = () => {
  const recues: Dart[] = []
  return { recues, onFlechette: (dart: Dart) => void recues.push(dart) }
}

const TOUT_FAIRE_RIEN = { onAnnuler: () => {}, onMultiplicateur: () => {} }

const x01 = (multiplicateur: Multiplier, onFlechette: (dart: Dart) => void) => (
  <PaveFlechettes
    multiplicateur={multiplicateur}
    onFlechette={onFlechette}
    peutAnnuler
    {...TOUT_FAIRE_RIEN}
  />
)

const cricket = (multiplicateur: Multiplier, onFlechette: (dart: Dart) => void) => (
  <PaveCricket
    cibles={CricketConfig.create().targets}
    multiplicateur={multiplicateur}
    onFlechette={onFlechette}
    peutAnnuler
    {...TOUT_FAIRE_RIEN}
  />
)

const tourDuMonde = (onFlechette: (dart: Dart) => void) => (
  <PaveCibles onFlechette={onFlechette} peutAnnuler onAnnuler={() => {}} />
)

describe('Pavé X01 / entraînement — Bulle et Hors remplacent « 25 » et « 0 »', () => {
  it('plus de touche « 25 » ni « 0 »', () => {
    render(x01('SIMPLE', () => {}))

    expect(screen.queryByRole('button', { name: '25' })).toBeNull()
    expect(screen.queryByRole('button', { name: '0' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Bulle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hors' })).toBeInTheDocument()
  })

  it.each([
    ['SIMPLE', Dart.bull()],
    ['DOUBLE', Dart.bullseye()],
  ] as const)('Bulle en %s enregistre la bonne fléchette', async (multiplicateur, attendue) => {
    const { recues, onFlechette } = enregistreur()
    render(x01(multiplicateur, onFlechette))

    await userEvent.setup().click(screen.getByRole('button', { name: 'Bulle' }))

    expect(recues).toEqual([attendue])
  })

  it('Bulle est désactivée en Triple et n’enregistre rien', async () => {
    const { recues, onFlechette } = enregistreur()
    render(x01('TRIPLE', onFlechette))

    const bulle = screen.getByRole('button', { name: 'Bulle' })
    expect(bulle).toBeDisabled()
    await userEvent.setup().click(bulle)

    expect(recues).toEqual([])
  })

  it.each(['SIMPLE', 'DOUBLE', 'TRIPLE'] as const)(
    'Hors enregistre MISS en %s : il ignore la bascule',
    async (multiplicateur) => {
      const { recues, onFlechette } = enregistreur()
      render(x01(multiplicateur, onFlechette))

      await userEvent.setup().click(screen.getByRole('button', { name: 'Hors' }))

      expect(recues).toEqual([Dart.miss()])
    },
  )
})

describe('Pavé Cricket', () => {
  it('six cibles dans l’ordre de la feuille, Bulle et Hors dans la rangée commune', () => {
    render(cricket('SIMPLE', () => {}))
    const pave = screen.getByRole('region', { name: 'Saisie des cibles touchées' })

    const noms = within(pave)
      .getAllByRole('button')
      .map((bouton) => bouton.textContent)
    expect(noms.slice(0, 6)).toEqual(['20', '19', '18', '17', '16', '15'])
    expect(noms.slice(6, 9)).toEqual(['Bulle', 'Hors', 'Annuler'])
    expect(screen.getByRole('button', { name: '20' }).parentElement).toHaveClass('grid-cols-3')
  })

  it.each([
    ['SIMPLE', 'simple', undefined],
    ['DOUBLE', 'double', '×2'],
    ['TRIPLE', 'triple', '×3'],
  ] as const)(
    '%s : data-multiplicateur="%s", exposant des marques « %s »',
    (multiplicateur, attendu, marques) => {
      render(cricket(multiplicateur, () => {}))

      expect(screen.getByRole('region')).toHaveAttribute('data-multiplicateur', attendu)
      expect(
        screen.getByRole('button', { name: '20' }).querySelector('[aria-hidden="true"]')
          ?.textContent,
      ).toBe(marques)
      expect(screen.getByRole('button', { name: '20' })).toHaveClass('touche-armee')
      expect(screen.getByRole('button', { name: 'Bulle' })).toHaveClass('touche-armee')
      expect(screen.getByRole('button', { name: 'Hors' })).not.toHaveClass('touche-armee')
      expect(screen.getByRole('button', { name: 'Hors' })).toHaveClass('touche-hors')
      expect(screen.getByRole('button', { name: 'Bulle' })).not.toHaveClass('touche-hors')
      expect(screen.getByRole('button', { name: 'Annuler' })).not.toHaveClass('touche-armee')
    },
  )

  it('les fléchettes envoyées ne changent pas : cible × multiplicateur, Bulle, Hors', async () => {
    const { recues, onFlechette } = enregistreur()
    const utilisateur = userEvent.setup()
    const { rerender } = render(cricket('TRIPLE', onFlechette))

    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    rerender(cricket('DOUBLE', onFlechette))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))
    rerender(cricket('SIMPLE', onFlechette))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    expect(recues).toEqual([Dart.triple(19), Dart.bullseye(), Dart.miss(), Dart.bull()])
  })

  it('Bulle est désactivée en Triple', () => {
    render(cricket('TRIPLE', () => {}))

    expect(screen.getByRole('button', { name: 'Bulle' })).toBeDisabled()
  })

  it('exposant « ×2 » sur la Bulle en Double (laiton), absent en Simple et en Triple', () => {
    const exposantBulle = () =>
      screen.getByRole('button', { name: 'Bulle' }).querySelector('[aria-hidden="true"]')
    const { rerender } = render(cricket('SIMPLE', () => {}))
    expect(exposantBulle()).toBeNull()

    rerender(cricket('DOUBLE', () => {}))
    expect(exposantBulle()?.textContent).toBe('×2')
    expect(exposantBulle()).toHaveClass('exposant-touche')

    rerender(cricket('TRIPLE', () => {}))
    expect(exposantBulle()).toBeNull()
  })
})

describe('Pavé Tour du monde', () => {
  it('pas de rail, pas de data-multiplicateur, aucune touche armée', () => {
    render(tourDuMonde(() => {}))
    const pave = screen.getByRole('region', { name: 'Saisie des cibles touchées' })

    expect(pave).not.toHaveAttribute('data-multiplicateur')
    for (const nom of ['Simple', 'Double', 'Triple']) {
      expect(screen.queryByRole('button', { name: nom })).toBeNull()
    }
    expect(pave.querySelector('.touche-armee')).toBeNull()
  })

  it('envoie des simples, la Bulle simple et MISS', async () => {
    const { recues, onFlechette } = enregistreur()
    const utilisateur = userEvent.setup()
    render(tourDuMonde(onFlechette))

    await utilisateur.click(screen.getByRole('button', { name: '17' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))

    expect(recues).toEqual([Dart.single(17), Dart.bull(), Dart.miss()])
  })

  it('les cases de volée et Annuler s’écrivent sans « S »', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')
    const matchId = await services.playTourDuMonde.start({
      playerIds: [kevin.id, julien.id],
      config: TourDuMondeConfig.create({ targets: [20, 19, 18] }),
    })
    renderWithServices(<App />, { services, route: `/partie/${matchId}` })

    await utilisateur.click(await screen.findByRole('button', { name: '16' }))

    expect(screen.getByRole('button', { name: 'Annuler 16 de Kevin' })).toHaveTextContent(
      'Annuler 16',
    )
    expect(screen.getByLabelText('Volée en cours')).toHaveTextContent('16——')
    expect(screen.getByLabelText('Volée en cours')).not.toHaveTextContent('S16')
  })

  it('libelleFlechetteTourDuMonde : « 17 », jamais « S17 » ; Dart.label reste intact', () => {
    expect(libelleFlechetteTourDuMonde(Dart.single(17))).toBe('17')
    expect(libelleFlechetteTourDuMonde(Dart.miss())).toBe('0')
    expect(libelleFlechetteTourDuMonde(Dart.bull())).toBe(Dart.label(Dart.bull()))
    expect(Dart.label(Dart.single(17))).toBe('S17')
  })
})

describe.each([
  ['X01', () => x01('SIMPLE', () => {}), true],
  ['Cricket', () => cricket('SIMPLE', () => {}), true],
  ['Tour du monde', () => tourDuMonde(() => {}), false],
] as [string, () => ReactElement, boolean][])('Structure commune — %s', (_jeu, pave, avecRail) => {
  it('rangée Bulle · Hors · Annuler en 2 · 1 · 2 colonnes sur 5, le rail dessous', () => {
    render(pave())
    const bulle = screen.getByRole('button', { name: 'Bulle' })
    const hors = screen.getByRole('button', { name: 'Hors' })
    const annuler = screen.getByRole('button', { name: /^Annuler/ })

    const rangee = bulle.parentElement as HTMLElement
    expect(hors.parentElement).toBe(rangee)
    expect(annuler.parentElement).toBe(rangee)
    expect(rangee).toHaveClass('grid-cols-5')
    expect([...rangee.children]).toEqual([bulle, hors, annuler])
    expect(bulle).toHaveClass('col-span-2')
    expect(hors).toHaveClass('col-span-1')
    expect(annuler).toHaveClass('col-span-2')

    const suivant = rangee.nextElementSibling
    if (avecRail) {
      expect(suivant).not.toBeNull()
      expect(within(suivant as HTMLElement).getAllByRole('button')).toHaveLength(3)
    } else {
      expect(suivant).toBeNull()
    }
  })

  it('la grille des cibles vient avant la rangée Bulle · Hors · Annuler', () => {
    render(pave())
    const grille = screen.getByRole('button', { name: '20' }).parentElement as HTMLElement
    const rangee = screen.getByRole('button', { name: 'Bulle' }).parentElement as HTMLElement

    expect(grille).not.toBe(rangee)
    expect(grille.compareDocumentPosition(rangee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(grille.nextElementSibling).toBe(rangee)
  })

  it('mêmes tailles : touches de 52 px (48 en paysage), mots en 16 px, Annuler en 12 px', () => {
    render(pave())

    for (const bouton of screen.getAllByRole('button')) {
      if (['Simple', 'Double', 'Triple'].includes(bouton.textContent ?? '')) continue
      expect(bouton, bouton.textContent ?? '').toHaveClass('min-h-[3.25rem]', 'paysage:min-h-12')
    }
    expect(screen.getByRole('button', { name: 'Bulle' })).toHaveClass('text-base', 'uppercase')
    expect(screen.getByRole('button', { name: 'Hors' })).toHaveClass('text-base', 'uppercase')
    expect(screen.getByRole('button', { name: /^Annuler/ })).toHaveClass('text-etiquette')
  })
})

describe('Disposition — le pavé est calé en bas en paysage', () => {
  it('le conteneur de saisie porte paysage:self-end, jamais self-center', () => {
    render(
      <DispositionPartie enTete={<span>bandeau</span>} nomPartie="Finale" saisie={<b>saisie</b>}>
        <span>lecture</span>
      </DispositionPartie>,
    )
    const conteneur = screen.getByText('saisie').parentElement

    expect(conteneur).toHaveClass('paysage:self-end')
    expect(conteneur).not.toHaveClass('paysage:self-center')
  })
})
