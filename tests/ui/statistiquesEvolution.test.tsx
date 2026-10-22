import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices, SettableClock } from '../fakes'
import { renderWithServices } from './renderWithServices'

/*
 * jsdom ne met rien en page : la fenêtre de la courbe n'a ni largeur ni
 * défilement. On les pose sur le prototype, à l'échelle la plus simple — la
 * fenêtre visible fait 295 px, soit **un pixel par unité** de la planche — et
 * `scrollWidth` se déduit de la largeur CSS du SVG tracé (un pourcentage de la
 * fenêtre), comme le ferait le navigateur. `scrollLeft` est borné comme lui.
 * Le vrai rendu, les vrais gestes et la barre native restent à voir à l'écran.
 */
const LARGEUR_VISIBLE = 295
const PAS = 280 / 13
const defilements = new WeakMap<Element, number>()
const PROPRIETES = ['scrollLeft', 'scrollWidth', 'clientWidth'] as const
let restaurer: () => void = () => {}

const largeurContenu = (element: Element): number => {
  const trace = element.querySelector(':scope > svg') as SVGSVGElement | null
  const largeur = trace?.style.width ?? ''
  return largeur.endsWith('%')
    ? Math.round((LARGEUR_VISIBLE * Number.parseFloat(largeur)) / 100)
    : LARGEUR_VISIBLE
}

beforeEach(() => {
  const prototype = HTMLElement.prototype
  const avant = PROPRIETES.map(
    (nom) => [nom, Object.getOwnPropertyDescriptor(prototype, nom)] as const,
  )
  Object.defineProperty(prototype, 'clientWidth', {
    configurable: true,
    get: () => LARGEUR_VISIBLE,
  })
  Object.defineProperty(prototype, 'scrollWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return largeurContenu(this)
    },
  })
  Object.defineProperty(prototype, 'scrollLeft', {
    configurable: true,
    get(this: HTMLElement) {
      return defilements.get(this) ?? 0
    },
    set(this: HTMLElement, valeur: number) {
      const max = Math.max(0, largeurContenu(this) - LARGEUR_VISIBLE)
      defilements.set(this, Math.min(max, Math.max(0, valeur)))
    },
  })
  restaurer = () => {
    for (const [nom, descripteur] of avant) {
      if (descripteur) Object.defineProperty(prototype, nom, descripteur)
      else Reflect.deleteProperty(prototype, nom)
    }
  }
})

afterEach(() => restaurer())

/** Le 22 octobre 2026 au soir : « aujourd'hui » des tests. */
const MAINTENANT = new Date(2026, 9, 22, 22).getTime()

/**
 * `nombre` parties de Kevin (et des autres), une par jour à partir du 1er septembre :
 * la k-ième fait une volée de trois simples k (moyenne 3k, de 3 à 60 en boucle).
 */
const avecParties = async (nombre: number, autres: readonly string[] = []) => {
  const horloge = new SettableClock(MAINTENANT)
  const { services, dependencies } = fakeServices({ clock: horloge })
  const kevin = await services.managePlayers.create('Kevin')
  const joueurs = [kevin.id]
  for (const nom of autres) joueurs.push((await services.managePlayers.create(nom)).id)
  for (let k = 0; k < nombre; k++) {
    horloge.regler(new Date(2026, 8, 1 + k, 20).getTime())
    const valeur = ((k % 20) + 1) as Parameters<typeof Dart.single>[0]
    await partie(services, joueurs, [
      [Dart.single(valeur), Dart.single(valeur), Dart.single(valeur)],
      ...autres.map(() => [Dart.single(20), Dart.single(20), Dart.single(20)]),
    ])
  }
  horloge.regler(MAINTENANT)
  return { services, dependencies, horloge, kevin }
}

const partie = async (
  services: Services,
  joueurs: readonly PlayerId[],
  volees: readonly (readonly Dart[])[],
) => {
  const matchId = await services.startMatch.execute({
    playerIds: [...joueurs],
    config: X01Config.create({ legsToWin: 1 }),
  })
  for (const darts of volees) await services.recordVisit.execute({ matchId, darts: [...darts] })
  return matchId
}

const ouvrir = (services: Services) =>
  renderWithServices(<App />, { services, route: '/statistiques' })

const carte = () => screen.findByRole('region', { name: 'Évolution' })
const lecture = async () => within(await carte()).getByRole('status').textContent ?? ''
const trace = async () => within(await carte()).getByRole('img', { name: /^Courbe/ })
const fenetre = async () => (await trace()).parentElement as HTMLElement
const curseur = () => screen.getByRole('slider', { name: 'Partie lue sur la courbe' })
const datesAffichees = async () =>
  [...(await trace()).querySelectorAll('text')].map((texte) => texte.textContent)

/** Un appui bref, au même endroit : la sélection au lâcher. */
const appuyer = (cible: HTMLElement, clientX: number) => {
  fireEvent.pointerDown(cible, { clientX, clientY: 80, pointerId: 1, button: 0 })
  fireEvent.pointerUp(cible, { clientX, clientY: 80, pointerId: 1, button: 0 })
}

describe('Évolution — la carte et ses états', () => {
  it('sous la cible, avant les cartes du podium, avec trois bascules et Moyenne au départ', async () => {
    const { services } = await avecParties(3)
    ouvrir(services)

    const evolution = await carte()
    const podium = screen.getByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' })
    const plateau = screen.getByRole('img', { name: /fléchettes$/ })
    // L'ordre du document : cible, Évolution, podium.
    expect(
      plateau.compareDocumentPosition(evolution) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      evolution.compareDocumentPosition(podium) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    const bascules = within(within(evolution).getByRole('group', { name: 'Mesure tracée' }))
      .getAllByRole('button')
      .map((bouton) => [
        bouton.getAttribute('aria-label'),
        bouton.textContent,
        bouton.getAttribute('aria-pressed'),
      ])
    expect(bascules).toEqual([
      ['Moy., Moyenne', 'Moy.', 'true'],
      ['F9, First 9', 'F9', 'false'],
      ['Volée, Meilleure volée', 'Volée', 'false'],
    ])
    // Le pictogramme est muet : le titre seul nomme la carte.
    expect(
      within(evolution).getByRole('heading', { level: 2, name: 'Évolution' }),
    ).toBeInTheDocument()
  })

  it('trois parties : la dernière sélectionnée, la tendance et son écart, la légende', async () => {
    const { services } = await avecParties(3)
    ouvrir(services)

    // Moyennes 3, 6, 9 ; la tendance au rang 3 est la base : écart « 0 ».
    expect(await lecture()).toBe(
      'Moyenne : 9,0 Partie 3 sur 3 · 3 sept 0 tendance depuis les 3 premières parties',
    )
    expect((await trace()).getAttribute('aria-label')).toBe('Courbe de Kevin, partie par partie')
    expect(curseur()).toHaveAttribute('aria-valuetext', 'Partie 3 sur 3, 3 sept : 9,0')
    const evolution = await carte()
    expect(within(evolution).getByText('Une partie')).toBeInTheDocument()
    expect(within(evolution).getByText('Tendance, 3 parties')).toBeInTheDocument()
    // Sa moyenne : 18 points ÷ 9 fléchettes × 3.
    expect(within(evolution).getByText('Sa moyenne 6,0')).toBeInTheDocument()
    expect(await datesAffichees()).toEqual(['1 sept', '2 sept', '3 sept'])
  })

  it('une seule partie : un carré, son chiffre et sa date, une phrase — ni bascule ni curseur', async () => {
    const { services } = await avecParties(1)
    ouvrir(services)

    const evolution = await carte()
    expect((await trace()).getAttribute('aria-label')).toBe('Courbe de Kevin, une partie')
    expect(await lecture()).toBe('Moyenne : 3,0 Partie 1 sur 1 · 1 sept')
    expect((await trace()).querySelectorAll('rect')).toHaveLength(1)
    expect(within(evolution).queryByRole('group', { name: 'Mesure tracée' })).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()
    const phrase = within(evolution)
      .getByText(/^La tendance apparaît/)
      .closest('p')
    expect(phrase?.textContent).toBe('La tendance apparaît à la 3e partie.')
    expect(phrase?.querySelector('sup')?.textContent).toBe('e')
    expect(within(evolution).queryByText('Une partie')).toBeNull()
    // Ni défilement : pas de fenêtre qui défile.
    expect((await fenetre()).className).not.toMatch(/overflow-x-auto/)
  })

  it('deux parties : la planche C, et « Encore une partie pour la tracer. »', async () => {
    const { services } = await avecParties(2)
    ouvrir(services)

    const evolution = await carte()
    expect((await trace()).getAttribute('aria-label')).toBe('Courbe de Kevin, deux parties')
    expect(await lecture()).toBe('Moyenne : 6,0 Partie 2 sur 2 · 2 sept')
    expect(
      within(evolution)
        .getByText(/^La tendance apparaît/)
        .closest('p')?.textContent,
    ).toBe('La tendance apparaît à la 3e partie. Encore une partie pour la tracer.')
    expect(within(evolution).queryByRole('group', { name: 'Mesure tracée' })).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()
    expect(await datesAffichees()).toEqual(['1 sept', '2 sept'])
    // Un appui ne sélectionne rien : il n'y a rien à choisir.
    appuyer(await fenetre(), 5)
    expect(await lecture()).toBe('Moyenne : 6,0 Partie 2 sur 2 · 2 sept')
  })

  it('aucune partie sur la période : pas de carte, l’écran garde « Rien sur cette période »', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await avecParties(3)
    ouvrir(services)
    await carte()

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    expect(await screen.findByText('Rien sur cette période')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Évolution' })).toBeNull()
  })

  it('un joueur sans fléchette sur la période : la cible, mais pas de carte', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(MAINTENANT)
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')
    const sarah = await services.managePlayers.create('Sarah')
    // Sarah est à la partie, mais elle n'a pas encore lancé.
    await partie(
      services,
      [kevin.id, sarah.id],
      [[Dart.single(20), Dart.single(20), Dart.single(20)]],
    )
    ouvrir(services)

    await carte()
    await utilisateur.click(screen.getByRole('button', { name: 'Sarah' }))
    await screen.findByRole('img', { name: /^Sarah :/ })
    expect(screen.queryByRole('region', { name: 'Évolution' })).toBeNull()
  })

  it('un seul joueur : pas de sélecteur, la carte s’affiche', async () => {
    const { services } = await avecParties(3)
    ouvrir(services)

    await carte()
    expect(screen.queryByRole('group', { name: 'Joueur' })).toBeNull()
  })

  it('le dernier point de Moyenne est la carte Moyenne du podium, sur une période d’une partie', async () => {
    const utilisateur = userEvent.setup()
    const horloge = new SettableClock(MAINTENANT)
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')
    horloge.regler(new Date(2026, 6, 3, 20).getTime())
    await partie(services, [kevin.id], [[Dart.single(1), Dart.single(1), Dart.single(1)]])
    horloge.regler(new Date(2026, 9, 22, 20).getTime())
    // Ce soir : 100, 41 → 141 points en 6 fléchettes, moyenne 70,5.
    await partie(
      services,
      [kevin.id],
      [
        [Dart.triple(20), Dart.single(20), Dart.single(20)],
        [Dart.single(20), Dart.single(20), Dart.single(1)],
      ],
    )
    horloge.regler(MAINTENANT)
    ouvrir(services)
    await carte()

    await utilisateur.click(screen.getByRole('button', { name: "Aujourd'hui" }))
    await waitFor(async () => expect(await lecture()).toMatch(/Partie 1 sur 1/))
    const valeur = (await carte()).querySelector('output b')?.textContent
    expect(valeur).toBe('70,5')
    const podium = screen.getByRole('region', { name: 'Moyenne 3 fl., Moyenne 3 fléchettes' })
    expect(within(podium).getAllByText(valeur as string).length).toBeGreaterThan(0)
  })
})

describe('Évolution — au-delà de 14 parties, la courbe défile', () => {
  it('31 parties : 31 points numérotés jusqu’au bout, ouverte en fin de courbe, sans aucune mention de plafond', async () => {
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    expect((await trace()).querySelectorAll('rect')).toHaveLength(31)
    expect(vue.className).toMatch(/overflow-x-auto/)
    expect(vue.scrollWidth).toBeGreaterThan(vue.clientWidth)
    expect(vue.scrollLeft).toBe(vue.scrollWidth - vue.clientWidth)
    expect(await lecture()).toMatch(/Partie 31 sur 31 · 1 oct/)
    expect((curseur() as HTMLInputElement).value).toBe('30')
    expect(screen.queryByText(/dernières parties/)).toBeNull()
    // Les dates de la portion visible : de la 18ᵉ partie à la 31ᵉ.
    expect(await datesAffichees()).toEqual(['18 sept', '24 sept', '1 oct'])
  })

  it('un appui sélectionne la partie sous le doigt, défilement compris', async () => {
    const { services } = await avecParties(16)
    ouvrir(services)

    const vue = await fenetre()
    vue.getBoundingClientRect = () => new DOMRect(10, 0, LARGEUR_VISIBLE, 200)
    const fin = vue.scrollWidth - vue.clientWidth
    // 5 px dans la fenêtre (15 à l'écran), défilée de `fin` : la partie au plus près.
    appuyer(vue, 15)
    const attendu = Math.round(fin / PAS) + 1
    expect(await lecture()).toMatch(new RegExp(`Partie ${attendu} sur 16`))
    expect((curseur() as HTMLInputElement).value).toBe(String(attendu - 1))
  })

  it('un pointercancel (le navigateur défile) ne sélectionne rien', async () => {
    const { services } = await avecParties(16)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.pointerDown(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 0 })
    fireEvent.pointerCancel(vue, { clientX: 5, clientY: 80, pointerId: 1 })
    fireEvent.pointerUp(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 0 })
    expect(await lecture()).toMatch(/Partie 16 sur 16/)
  })

  it('un glissé ne sélectionne jamais, même quand la courbe tient', async () => {
    const { services } = await avecParties(5)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.pointerDown(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 0 })
    fireEvent.pointerMove(vue, { clientX: 60, clientY: 80, pointerId: 1, buttons: 1 })
    fireEvent.pointerUp(vue, { clientX: 120, clientY: 80, pointerId: 1, button: 0 })
    expect(await lecture()).toMatch(/Partie 5 sur 5/)
    // L'appui, lui, sélectionne.
    appuyer(vue, 5)
    expect(await lecture()).toMatch(/Partie 1 sur 5/)
  })

  it('la sélection reste sur sa partie quand on fait défiler, et les dates suivent la vue', async () => {
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    // En fin de courbe, 5 px dans la fenêtre : la 18ᵉ partie.
    appuyer(vue, 5)
    expect(await lecture()).toMatch(/Partie 18 sur 31/)
    vue.scrollLeft = 0
    fireEvent.scroll(vue)
    expect(await lecture()).toMatch(/Partie 18 sur 31/)
    await waitFor(async () =>
      expect(await datesAffichees()).toEqual(['1 sept', '7 sept', '14 sept']),
    )
  })

  it('au clavier, le curseur déplace la sélection et ramène la partie en vue au plus court', async () => {
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    const fin = vue.scrollWidth - vue.clientWidth
    fireEvent.change(curseur(), { target: { value: '29' } })
    expect(await lecture()).toMatch(/Partie 30 sur 31 · 30 sept/)
    // Déjà visible : la vue ne bouge pas.
    expect(vue.scrollLeft).toBe(fin)

    fireEvent.change(curseur(), { target: { value: '0' } })
    expect(await lecture()).toMatch(/Partie 1 sur 31 · 1 sept/)
    expect(vue.scrollLeft).toBe(0)
    expect(await datesAffichees()).toEqual(['1 sept', '7 sept', '14 sept'])
  })
})

describe('Évolution — remises à zéro', () => {
  it('changer de mesure remet la dernière partie et la fin de la courbe', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.change(curseur(), { target: { value: '0' } })
    expect(vue.scrollLeft).toBe(0)

    await utilisateur.click(within(await carte()).getByRole('button', { name: 'F9, First 9' }))
    expect(await lecture()).toMatch(/^First 9 : .*Partie 31 sur 31/)
    expect(vue.scrollLeft).toBe(vue.scrollWidth - vue.clientWidth)
    expect(within(await carte()).getByRole('button', { name: 'F9, First 9' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // La ligne pointillée suit la mesure ; Meilleure volée n'en a pas.
    expect(within(await carte()).getByText(/^Son First 9 moyen/)).toBeInTheDocument()
    await utilisateur.click(
      within(await carte()).getByRole('button', { name: 'Volée, Meilleure volée' }),
    )
    expect(await lecture()).toMatch(/^Meilleure volée : 33 Partie 31 sur 31/)
    expect(within(await carte()).queryByText(/^Sa moyenne|^Son First 9/)).toBeNull()
  })

  it('changer de joueur remet la dernière partie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await avecParties(4, ['Julien'])
    ouvrir(services)

    const ruban = await screen.findByRole('group', { name: 'Joueur' })
    await utilisateur.click(within(ruban).getByRole('button', { name: 'Kevin' }))
    await carte()
    appuyer(await fenetre(), 5)
    expect(await lecture()).toMatch(/Partie 1 sur 4/)

    await utilisateur.click(within(ruban).getByRole('button', { name: 'Julien' }))
    await waitFor(async () =>
      expect((await trace()).getAttribute('aria-label')).toBe(
        'Courbe de Julien, partie par partie',
      ),
    )
    expect(await lecture()).toMatch(/Partie 4 sur 4/)
    await utilisateur.click(within(ruban).getByRole('button', { name: 'Kevin' }))
    await waitFor(async () =>
      expect((await trace()).getAttribute('aria-label')).toBe('Courbe de Kevin, partie par partie'),
    )
    expect(await lecture()).toMatch(/Partie 4 sur 4/)
  })

  it('changer de période remet la dernière partie', async () => {
    const utilisateur = userEvent.setup()
    const { services, horloge, kevin } = await avecParties(4)
    // Deux parties de plus ce mois-ci, pour que « 30 jours » en garde trois.
    horloge.regler(new Date(2026, 9, 20, 20).getTime())
    await partie(services, [kevin.id], [[Dart.single(5), Dart.single(5), Dart.single(5)]])
    horloge.regler(new Date(2026, 9, 21, 20).getTime())
    await partie(services, [kevin.id], [[Dart.single(5), Dart.single(5), Dart.single(5)]])
    horloge.regler(new Date(2026, 9, 22, 20).getTime())
    await partie(services, [kevin.id], [[Dart.single(5), Dart.single(5), Dart.single(5)]])
    horloge.regler(MAINTENANT)
    ouvrir(services)

    appuyer(await fenetre(), 5)
    expect(await lecture()).toMatch(/Partie 1 sur 7/)
    await utilisateur.click(screen.getByRole('button', { name: '30 jours' }))
    await waitFor(async () => expect(await lecture()).toMatch(/Partie 3 sur 3/))
  })
})

describe('Évolution — les bords du défilement (14 et 15 parties)', () => {
  it('14 parties : la planche, sans défilement, les dates de toute la courbe', async () => {
    const { services } = await avecParties(14)
    ouvrir(services)

    const vue = await fenetre()
    expect((await trace()).querySelectorAll('rect')).toHaveLength(14)
    expect(vue.className).not.toMatch(/overflow-x-auto/)
    expect(vue.scrollWidth).toBe(vue.clientWidth)
    expect(vue.scrollLeft).toBe(0)
    expect(await lecture()).toMatch(/Partie 14 sur 14 · 14 sept/)
    expect(await datesAffichees()).toEqual(['1 sept', '7 sept', '14 sept'])
  })

  it('15 parties : la courbe défile, ouverte en fin, les dates de la portion visible', async () => {
    const { services } = await avecParties(15)
    ouvrir(services)

    const vue = await fenetre()
    expect(vue.className).toMatch(/overflow-x-auto/)
    expect(vue.scrollWidth).toBeGreaterThan(vue.clientWidth)
    expect(vue.scrollLeft).toBe(vue.scrollWidth - vue.clientWidth)
    expect(await lecture()).toMatch(/Partie 15 sur 15 · 15 sept/)
    // La première partie est sortie de la vue : de la 2ᵉ à la 15ᵉ.
    expect(await datesAffichees()).toEqual(['2 sept', '8 sept', '15 sept'])
  })
})

describe('Évolution — gestes qui ne sélectionnent pas', () => {
  it('un bouton autre que le principal ne sélectionne rien', async () => {
    const { services } = await avecParties(5)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.pointerDown(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 2 })
    fireEvent.pointerUp(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 2 })
    expect(await lecture()).toMatch(/Partie 5 sur 5/)
  })

  it('un glissé vertical (la page défile) ne sélectionne rien', async () => {
    const { services } = await avecParties(5)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.pointerDown(vue, { clientX: 5, clientY: 80, pointerId: 1, button: 0 })
    fireEvent.pointerUp(vue, { clientX: 5, clientY: 140, pointerId: 1, button: 0 })
    expect(await lecture()).toMatch(/Partie 5 sur 5/)
  })

  it('un appui sur la bascule déjà active ne remet ni la sélection ni la vue', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    fireEvent.change(curseur(), { target: { value: '0' } })
    expect(vue.scrollLeft).toBe(0)
    await utilisateur.click(within(await carte()).getByRole('button', { name: 'Moy., Moyenne' }))
    expect(await lecture()).toMatch(/Partie 1 sur 31/)
    expect(vue.scrollLeft).toBe(0)
  })
})

describe('Évolution — au clavier, de vraies touches', () => {
  it('← et → déplacent la sélection d’une partie, Début et Fin vont aux bouts, la vue suit', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await avecParties(31)
    ouvrir(services)

    const vue = await fenetre()
    const fin = vue.scrollWidth - vue.clientWidth
    curseur().focus()
    await utilisateur.keyboard('{ArrowLeft}')
    expect(await lecture()).toMatch(/Partie 30 sur 31/)
    await utilisateur.keyboard('{ArrowRight}{ArrowRight}')
    // Bornée à la dernière.
    expect(await lecture()).toMatch(/Partie 31 sur 31/)
    expect(vue.scrollLeft).toBe(fin)
    await utilisateur.keyboard('{Home}')
    expect(await lecture()).toMatch(/Partie 1 sur 31/)
    expect(vue.scrollLeft).toBe(0)
    await utilisateur.keyboard('{End}')
    expect(await lecture()).toMatch(/Partie 31 sur 31/)
    expect(vue.scrollLeft).toBe(fin)
    expect(curseur()).toHaveAttribute('aria-valuetext', 'Partie 31 sur 31, 1 oct : 33,0')
  })
})

describe('Évolution — changement d’année', () => {
  it('l’année s’écrit sous la courbe et dans la lecture quand la courbe franchit le 1er janvier', async () => {
    const horloge = new SettableClock(MAINTENANT)
    const { services } = fakeServices({ clock: horloge })
    const kevin = await services.managePlayers.create('Kevin')
    for (const date of [
      new Date(2025, 11, 30, 20),
      new Date(2025, 11, 31, 20),
      new Date(2026, 0, 2, 20),
    ]) {
      horloge.regler(date.getTime())
      await partie(services, [kevin.id], [[Dart.single(20), Dart.single(20), Dart.single(20)]])
    }
    horloge.regler(MAINTENANT)
    ouvrir(services)

    expect(await lecture()).toMatch(/Partie 3 sur 3 · 2 janv 2026/)
    expect(await datesAffichees()).toEqual(['30 déc 2025', '31 déc 2025', '2 janv 2026'])
  })
})

describe('Évolution — un cache périmé relu en fond (constat B1)', () => {
  it.each([
    [3, 'la courbe tient'],
    [15, 'la courbe défile'],
  ])(
    '%i parties puis une de plus (%s) : la nouvelle partie est sélectionnée et visible',
    async (nombre) => {
      const { services, horloge, kevin } = await avecParties(nombre)
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const premier = renderWithServices(<App />, { services, route: '/statistiques', queryClient })
      expect(await lecture()).toMatch(new RegExp(`Partie ${nombre} sur ${nombre} `))
      premier.unmount()

      // Une partie de plus, jouée pendant qu'on était ailleurs.
      horloge.regler(new Date(2026, 9, 22, 21).getTime())
      await partie(services, [kevin.id], [[Dart.single(20), Dart.single(20), Dart.single(20)]])
      horloge.regler(MAINTENANT)

      // Même QueryClient : l'écran s'ouvre sur l'ancienne série, puis la relit.
      renderWithServices(<App />, { services, route: '/statistiques', queryClient })
      const total = nombre + 1
      await waitFor(async () =>
        expect(await lecture()).toMatch(new RegExp(`Partie ${total} sur ${total} · 22 oct`)),
      )
      const vue = await fenetre()
      expect(vue.scrollLeft).toBe(Math.max(0, vue.scrollWidth - vue.clientWidth))
      expect(await datesAffichees()).toContain('22 oct')
    },
  )
})
