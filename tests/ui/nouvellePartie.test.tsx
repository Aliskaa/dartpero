import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Dependencies, Services } from '@/composition/container'
import { GAME_MODE_IDS } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { SLUG_MODE } from '@/ui/chemins'
import { AUCUN_JOUEUR_PARTIE, LIBELLE_MODE, TITRE_REGLES } from '@/ui/labels'
import { fakeServices } from '../fakes'
import { ouverture } from '../use-cases/lancerPartie'
import { retourTelephone } from './gestes'
import { renderWithServices } from './renderWithServices'

/** Une base de profils ; `retenus` pré-remplit la sélection de la dernière partie. */
const base = async (noms: readonly string[], retenus: readonly string[] = []) => {
  const { services, dependencies } = fakeServices()
  const ids = new Map<string, PlayerId>()
  for (const nom of noms) ids.set(nom, (await services.managePlayers.create(nom)).id)
  if (retenus.length > 0) {
    dependencies.devices.preferences.write(
      'partie:joueurs',
      retenus.map((nom) => ids.get(nom)),
    )
  }
  return { services, dependencies, ids }
}

const ouvrir = (services: Services, route = '/nouvelle-partie') =>
  renderWithServices(<App />, { services, route })

const titre = () => screen.getByRole('heading', { level: 1 })

const derniere = async (services: Services) => {
  const partie = (await services.getMatchHistory.execute())[0]
  if (!partie) throw new Error('aucune partie lancée')
  return partie
}

const rail = (nom: string) => within(screen.getByRole('group', { name: nom }))

const poignee = (nom: string) => screen.getByRole('button', { name: `Déplacer ${nom}` })

type Utilisateur = ReturnType<typeof userEvent.setup>

/** Déplie « Plus de réglages » (sortie, entrée, sets) : replié à chaque ouverture de l'étape. */
const deplierPlus = (utilisateur: Utilisateur) =>
  utilisateur.click(screen.getByRole('button', { name: /plus de réglages/i }))

const lignesOrdre = () =>
  within(screen.getByRole('list', { name: 'Ordre de passage' })).getAllByRole('listitem')

/** Les pseudos de la feuille d'ordre, de haut en bas. */
const ordreAffiche = () =>
  lignesOrdre().map((ligne) => ligne.querySelector('.truncate')?.textContent)

/** Le joueur sous lequel la feuille écrit « COMMENCE ». */
const quiCommence = () =>
  screen.getByText('Commence').closest('li')?.querySelector('.truncate')?.textContent

/** Le focus sur une poignée, comme après une tabulation. */
const focaliser = (element: HTMLElement) =>
  act(() => {
    element.focus()
  })

describe('Nouvelle partie — étape 1, le jeu', () => {
  it('propose quatre jeux dans un ordre fixe, X01 en tête', async () => {
    const { services } = await base([])
    ouvrir(services)

    const cartes = await screen.findAllByRole('link')
    const jeux = ['X01', 'Cricket', 'Tour du monde', 'Entraînement']
    expect(cartes).toHaveLength(4)
    cartes.forEach((carte, rang) => {
      expect(carte.textContent?.startsWith(jeux[rang] ?? '?')).toBe(true)
    })
    expect(titre()).toHaveTextContent('Nouvelle partie')
  })

  /** Critère 3 : quatre tuiles, un seul lien chacune, une seule phrase, plus de champ nom. */
  it('pose les quatre jeux en tuiles 2 × 2, chacune un seul lien, sans champ nom', async () => {
    const { services } = await base([])
    ouvrir(services)

    const tuiles = await screen.findAllByRole('link')
    expect(tuiles).toHaveLength(4)
    const liste = tuiles[0]?.closest('ul')
    expect(liste).toHaveClass('grid-cols-2')
    expect(tuiles[0]).toHaveAccessibleName(/Décompter 301, 501 ou 701 jusqu’à zéro pile\./)
    expect(tuiles[1]).toHaveAccessibleName(/Fermer du 20 au 15 et la bulle avant les autres\./)
    expect(tuiles[2]).toHaveAccessibleName(/Du 20 au 1, puis la bulle\./)
    expect(tuiles[3]).toHaveAccessibleName(/Seul : faire le checkout d’un reste tiré au sort\./)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  /** Critère 2 : la barre marque l'étape courante, sans rien d'interactif. */
  it('marque l’étape 1 dans la barre, sans rien de touchable', async () => {
    const { services } = await base([])
    ouvrir(services)

    const barre = await screen.findByRole('list', { name: 'Étapes de la partie' })
    const etapes = within(barre).getAllByRole('listitem')
    expect(etapes.map((etape) => etape.textContent)).toEqual([
      '1 · Jeu',
      '2 · Joueurs',
      '3 · Ordre',
    ])
    expect(etapes[0]).toHaveAttribute('aria-current', 'step')
    expect(within(barre).queryAllByRole('link')).toHaveLength(0)
    expect(within(barre).queryAllByRole('button')).toHaveLength(0)
  })

  it('n’offre plus d’entraînement à part sur l’Accueil', async () => {
    const { services } = await base([])
    renderWithServices(<App />, { services, route: '/' })

    await screen.findByRole('link', { name: 'Nouvelle partie' })
    expect(screen.queryByRole('link', { name: /entraîner/i })).toBeNull()
  })
})

describe('Nouvelle partie — parcours complet', () => {
  /** Critère 1 : trois étapes, et la partie démarre avec le bon jeu, les bons réglages, le bon ordre. */
  it('démarre un X01 à deux avec les réglages et l’ordre choisis', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'])
    renderWithServices(<App />, { services, route: '/' })

    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    expect(titre()).toHaveTextContent('X01')

    // Les joueurs, depuis la liste des profils existants.
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Kevin/ }))
    await utilisateur.click(screen.getByRole('button', { name: /^Julien/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    // Les réglages.
    expect(await screen.findByRole('list', { name: 'Joueurs de la partie' })).toBeInTheDocument()
    await utilisateur.click(rail('Score de départ').getByRole('button', { name: '301' }))
    await utilisateur.click(rail('Manches à gagner').getByRole('button', { name: '3' }))
    await deplierPlus(utilisateur)
    await utilisateur.click(
      rail('Checkout').getByRole('button', { name: 'Checkout sur un double' }),
    )
    await utilisateur.click(rail('Entrée').getByRole('button', { name: 'Sur un double' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))

    // L'ordre : Julien passe devant.
    expect(titre()).toHaveTextContent('Ordre de jeu')
    expect(quiCommence()).toBe('Kevin')
    await focaliser(poignee('Julien'))
    await utilisateur.keyboard('{ArrowUp}')
    expect(quiCommence()).toBe('Julien')

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(await screen.findByLabelText('Score restant de Julien')).toHaveTextContent('301')

    const partie = await derniere(services)
    expect(partie.mode).toBe('X01')
    expect(partie.players.map((joueur) => joueur.name)).toEqual(['Julien', 'Kevin'])
    if (partie.mode !== 'X01') throw new Error('mode inattendu')
    expect(partie.config).toMatchObject({
      startingScore: 301,
      legsToWin: 3,
      setsToWin: 1,
      doubleOut: true,
      doubleIn: true,
    })
    // Le journal, lui aussi : c'est lui qui est rejoué.
    const premier = await ouverture(dependencies, partie.id)
    if (premier.type !== 'MatchStarted') throw new Error('événement d’ouverture inattendu')
    expect(premier.config).toMatchObject({ doubleOut: true, doubleIn: true })
  })

  /** Critère 9. */
  it('fait arriver les sets dans `X01Config.setsToWin`', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    // Replié : le récap dit quand même « sans sets ».
    expect(screen.getByText(/sans sets/i)).toBeInTheDocument()
    await deplierPlus(utilisateur)
    expect(rail('Sets à gagner').getByRole('button', { name: 'Sans' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await utilisateur.click(rail('Sets à gagner').getByRole('button', { name: '3' }))
    expect(screen.getByText(/premier à 3 sets/i)).toBeInTheDocument()
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await screen.findByLabelText('Score restant de Kevin')

    const partie = await derniere(services)
    if (partie.mode !== 'X01') throw new Error('mode inattendu')
    expect(partie.config.setsToWin).toBe(3)
  })

  /** T1 : la variante choisie à l'étape 2 arrive dans la config du Cricket. */
  it('démarre un Cricket cut-throat avec la variante choisie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/cricket')

    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    // Deux cartes : Standard est choisie d'abord, Cut-throat la remplace.
    expect(rail('Comptage').getByRole('button', { name: /^Standard/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await utilisateur.click(rail('Comptage').getByRole('button', { name: /^Cut-throat/ }))
    expect(screen.getByText('Cricket cut-throat')).toBeInTheDocument()
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(async () => expect((await services.getMatchHistory.execute()).length).toBe(1))

    const partie = await derniere(services)
    if (partie.mode !== 'CRICKET') throw new Error('mode inattendu')
    expect(partie.config.variant).toBe('CUT_THROAT')
  })

  /** Critère 11 : double out décoché sur des préférences vierges. */
  it('décoche le double out par défaut et le passe à `false`', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    // Replié, le récap dit quand même la sortie et l'entrée.
    expect(screen.getByText(/checkout libre/i)).toBeInTheDocument()
    expect(screen.getByText(/entrée libre/i)).toBeInTheDocument()
    await deplierPlus(utilisateur)
    expect(rail('Checkout').getByRole('button', { name: 'Checkout libre' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await screen.findByLabelText('Score restant de Kevin')

    const partie = await derniere(services)
    if (partie.mode !== 'X01') throw new Error('mode inattendu')
    expect(partie.config.doubleOut).toBe(false)
  })
})

describe('Nouvelle partie — entraînement', () => {
  /** Critère 2 : étape 2 en solo, pas d'étape 3, puis la séance démarre. */
  it('se règle en solo et démarre sans étape d’ordre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base([])
    ouvrir(services)

    await utilisateur.click(await screen.findByRole('link', { name: /^Entraînement/ }))
    expect(titre()).toHaveTextContent('Entraînement')
    expect(screen.getByText(/41 et 170/)).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Nouveau joueur' }))
    await utilisateur.type(screen.getByLabelText('Pseudo'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    // Un seul joueur : le + disparaît, et il n'y a pas d'ordre à régler.
    expect(await screen.findByText('1 / 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajouter un joueur' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Continuer' })).toBeNull()
    // Deux étapes seulement à l'entraînement.
    const etapes = within(screen.getByRole('list', { name: 'Étapes de la partie' }))
    expect(etapes.getAllByRole('listitem').map((etape) => etape.textContent)).toEqual([
      '1 · Jeu',
      '2 · Réglages',
    ])
    expect(etapes.getByText('1 · Jeu')).toHaveAttribute('data-etat', 'fait')
    expect(etapes.getByText('2 · Réglages')).toHaveAttribute('aria-current', 'step')
    expect(etapes.getByText('1 · Jeu')).not.toHaveAttribute('aria-current')
    expect(screen.getByText('non réglable')).toBeInTheDocument()

    await utilisateur.click(rail('Nombre de checkouts').getByRole('button', { name: '5' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Reste pour le checkout')).toBeInTheDocument()
    const partie = await derniere(services)
    expect(partie.mode).toBe('CHECKOUT_PRACTICE')
    if (partie.mode !== 'CHECKOUT_PRACTICE') throw new Error('mode inattendu')
    expect(partie.config.rounds).toBe(5)
  })

  it('n’a pas d’étape 3 : l’adresse renvoie à l’étape 2', async () => {
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/entrainement/ordre')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Ordre de passage' })).toBeNull()
  })

  /**
   * T2 : redondance défensive contre une fuite de la sélection de groupe dans
   * l'entraînement. L'entraînement lit sa propre sélection (un joueur au plus),
   * donc la garde générale « moins de deux joueurs » suffit déjà à le renvoyer
   * à l'étape 2 — ce test n'isole pas la garde propre à l'entraînement. Il ne
   * tomberait que si les deux gardes cédaient ensemble : la sélection de groupe
   * (ici à deux joueurs) servant aussi à l'entraînement, sans garde de mode.
   */
  it('n’a pas d’étape 3 même quand la sélection de groupe compte deux joueurs', async () => {
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/entrainement/ordre')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Ordre de passage' })).toBeNull()
  })

  /** T6 : l'entraînement se joue seul — un coché, les autres désactivés. */
  it('ne laisse sélectionner qu’un joueur existant', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/entrainement/joueurs')

    await utilisateur.click(await screen.findByRole('button', { name: /^Kevin/ }))
    expect(screen.getByRole('button', { name: /^Julien/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Kevin/ })).toBeEnabled()

    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))
    expect(await screen.findByText('1 / 1')).toBeInTheDocument()
  })

  it('reprend le premier joueur de la dernière partie, sans toucher à la sélection de groupe', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'], ['Julien', 'Kevin'])
    ouvrir(services, '/nouvelle-partie/entrainement')

    const rangee = await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).getByText('Julien')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Retirer Julien de la partie' }))
    expect(dependencies.devices.preferences.read('entrainement:joueur', 'absent')).toBeNull()
    expect(dependencies.devices.preferences.read<unknown[]>('partie:joueurs', [])).toHaveLength(2)
  })

  it('redirige l’ancienne adresse /entrainement vers la carte Entraînement', async () => {
    const { services } = await base([])
    ouvrir(services, '/entrainement')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement' }),
    ).toBeInTheDocument()
  })
})

describe('Nouvelle partie — ordre de jeu', () => {
  /** Critère 3 : l'ordre réglé à la poignée (ici au clavier), partie démarrée dans cet ordre. */
  it.each([
    ['cricket', 'CRICKET'],
    ['tour-du-monde', 'TOUR_DU_MONDE'],
  ] as const)('démarre %s à trois dans l’ordre réglé', async (slug, mode) => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Paul'], ['Kevin', 'Julien', 'Paul'])
    ouvrir(services, `/nouvelle-partie/${slug}/ordre`)

    await focaliser(await screen.findByRole('button', { name: 'Déplacer Paul' }))
    await utilisateur.keyboard('{ArrowUp}{ArrowUp}')
    expect(quiCommence()).toBe('Paul')

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await waitFor(async () => expect((await services.getMatchHistory.execute()).length).toBe(1))

    const partie = await derniere(services)
    expect(partie.mode).toBe(mode)
    expect(partie.players.map((joueur) => joueur.name)).toEqual(['Paul', 'Kevin', 'Julien'])
  })

  /** Critère 2 : à l'étape Ordre, les deux premières sont faites et la troisième est courante. */
  it('marque l’étape 3 courante et les deux premières faites dans la barre', async () => {
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    const barre = within(await screen.findByRole('list', { name: 'Étapes de la partie' }))
    expect(barre.getByText('3 · Ordre')).toHaveAttribute('aria-current', 'step')
    expect(barre.getByText('3 · Ordre')).toHaveAttribute('data-etat', 'courant')
    expect(barre.getByText('1 · Jeu')).toHaveAttribute('data-etat', 'fait')
    expect(barre.getByText('2 · Joueurs')).toHaveAttribute('data-etat', 'fait')
    expect(barre.getByText('2 · Joueurs')).not.toHaveAttribute('aria-current')
  })

  /** Le sous-titre de l'étape Ordre rappelle le jeu et, quand il y en a, la variante. */
  it.each([
    ['x01', 'X01 · 501'],
    ['cricket', 'Cricket · Standard'],
    ['tour-du-monde', 'Tour du monde'],
  ] as const)('sous-titre de l’étape Ordre pour %s : « %s »', async (slug, attendu) => {
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, `/nouvelle-partie/${slug}/ordre`)

    await screen.findByRole('list', { name: 'Ordre de passage' })
    expect(screen.getByText(attendu, { selector: 'p' })).toBeInTheDocument()
  })

  it('sous-titre de l’étape Ordre pour le Cricket cut-throat', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/cricket')

    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await utilisateur.click(rail('Comptage').getByRole('button', { name: /^Cut-throat/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))

    await screen.findByRole('list', { name: 'Ordre de passage' })
    expect(screen.getByText('Cricket · Cut-throat', { selector: 'p' })).toBeInTheDocument()
  })

  /** Le nom tapé à l'étape 2 survit jusqu'au lancement depuis l'étape Ordre. */
  it('lance depuis l’étape Ordre avec le nom tapé à l’étape 2', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/x01')

    await utilisateur.clear(await screen.findByLabelText(/^Nom de la partie/))
    await utilisateur.type(screen.getByLabelText(/^Nom de la partie/), 'Finale des potes')
    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))
    await screen.findByRole('list', { name: 'Ordre de passage' })
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await screen.findAllByLabelText(/^Score restant de/)

    const partie = await derniere(services)
    expect(partie.name).toBe('Finale des potes')
    expect(await ouverture(dependencies, partie.id)).toMatchObject({ name: 'Finale des potes' })
  })

  /** Critère 5 : un nom accessible, ↑ / ↓, le focus qui suit, l'annonce. */
  it('répond au clavier sur une poignée nommée, garde le focus et annonce la place', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Paul'], ['Kevin', 'Julien', 'Paul'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    const kevin = await screen.findByRole('button', { name: 'Déplacer Kevin' })
    expect(kevin).toHaveAccessibleDescription('Glissez, ou flèches haut et bas')

    // En tête, ↑ ne fait rien.
    await focaliser(kevin)
    await utilisateur.keyboard('{ArrowUp}')
    const ordre = () => lignesOrdre().map((ligne) => ligne.textContent)
    expect(ordre()[0]).toContain('Kevin')

    await utilisateur.keyboard('{ArrowDown}')
    expect(ordre()[1]).toContain('Kevin')
    // Le grand rang de la feuille : 2, devant le pseudo.
    expect(ordre()[1]).toMatch(/^2/)
    expect(poignee('Kevin')).toHaveFocus()
    expect(screen.getByText('Kevin : position 2 sur 3')).toBeInTheDocument()
  })

  /**
   * Critère 8 : « Tirer au sort » rebat la feuille tout de suite (l'aléa des
   * fakes est déterministe), « COMMENCE » suit le premier, et la partie part
   * dans l'ordre affiché. Plus d'interrupteur « Ordre aléatoire ».
   */
  it('rebat la feuille au tirage, annonce le nouvel ordre et lance la partie dans cet ordre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Paul'], ['Kevin', 'Julien', 'Paul'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    await screen.findByRole('button', { name: 'Déplacer Kevin' })
    expect(ordreAffiche()).toEqual(['Kevin', 'Julien', 'Paul'])
    expect(screen.queryByRole('button', { name: /ordre aléatoire/i })).toBeNull()

    await utilisateur.click(screen.getByRole('button', { name: 'Tirer au sort' }))

    expect(ordreAffiche()).toEqual(['Paul', 'Julien', 'Kevin'])
    expect(quiCommence()).toBe('Paul')
    // Les poignées restent : on peut encore réordonner.
    expect(screen.getAllByRole('button', { name: /^Déplacer/ })).toHaveLength(3)
    expect(
      screen.getByText('Ordre tiré au sort : Paul, Julien, Kevin. Paul commence.'),
    ).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await screen.findAllByLabelText(/^Score restant de/)

    const noms = (await derniere(services)).players.map((joueur) => joueur.name)
    expect(noms).toEqual(['Paul', 'Julien', 'Kevin'])
  })

  /** Q1 : vrai hasard, aucune relance. Le 2e tirage du fake redonne l'ordre d'avant, et c'est permis. */
  it('accepte un tirage qui redonne le même ordre, et rejoue le mouvement de la feuille', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien', 'Paul'], ['Kevin', 'Julien', 'Paul'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    const feuille = () => screen.getByRole('list', { name: 'Ordre de passage' })
    await screen.findByRole('button', { name: 'Déplacer Kevin' })
    expect(feuille()).not.toHaveClass('animate-monter')

    await utilisateur.click(screen.getByRole('button', { name: 'Tirer au sort' }))
    const premiere = feuille()
    expect(premiere).toHaveClass('animate-monter')
    expect(ordreAffiche()).toEqual(['Paul', 'Julien', 'Kevin'])

    await utilisateur.click(screen.getByRole('button', { name: 'Tirer au sort' }))
    // Même ordre qu'avant le geste, mais la feuille est remontée : le mouvement a rejoué.
    expect(ordreAffiche()).toEqual(['Paul', 'Julien', 'Kevin'])
    expect(feuille()).not.toBe(premiere)
    expect(feuille()).toHaveClass('animate-monter')
  })

  it('laisse réordonner à la main après un tirage, et mémorise l’ordre obtenu', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies, ids } = await base(
      ['Kevin', 'Julien', 'Paul'],
      ['Kevin', 'Julien', 'Paul'],
    )
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    await screen.findByRole('button', { name: 'Déplacer Kevin' })
    await utilisateur.click(screen.getByRole('button', { name: 'Tirer au sort' }))
    expect(
      (dependencies as Dependencies).devices.preferences.read<PlayerId[]>('partie:joueurs', []),
    ).toEqual([ids.get('Paul'), ids.get('Julien'), ids.get('Kevin')])

    await focaliser(poignee('Kevin'))
    await utilisateur.keyboard('{ArrowUp}')
    expect(ordreAffiche()).toEqual(['Paul', 'Kevin', 'Julien'])
    expect(quiCommence()).toBe('Paul')
  })

  /**
   * B1 : au relâcher, les lignes enjambées changent de place dans le DOM et
   * perdent leur décalage dans le même rendu. Animé, ce retour les ferait
   * sauter : la transition ne vit donc que **pendant** le geste.
   */
  it('n’anime les lignes que pendant le glisser, jamais au relâcher', async () => {
    const { services } = await base(['Kevin', 'Julien', 'Paul'], ['Kevin', 'Julien', 'Paul'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    const kevin = await screen.findByRole('button', { name: 'Déplacer Kevin' })
    const lignes = () =>
      within(screen.getByRole('list', { name: 'Ordre de passage' })).getAllByRole('listitem')
    const animees = () =>
      lignes().filter((ligne) => ligne.className.includes('transition-transform')).length
    expect(animees()).toBe(0)

    fireEvent.pointerDown(kevin, { isPrimary: true, button: 0, pointerId: 1, clientY: 0 })
    // Les deux autres s'écartent en douceur ; la ligne tenue suit le doigt sans retard.
    expect(animees()).toBe(2)

    fireEvent.pointerUp(kevin, { isPrimary: true, button: 0, pointerId: 1, clientY: 0 })
    expect(animees()).toBe(0)
  })

  /**
   * Constat n° 1 de la revue : la borne du geste arrête le centre de la ligne
   * tenue **exactement** sur le milieu de la première / dernière ligne. Le seuil
   * doit donc être atteignable à cette borne, sans quoi la première et la
   * dernière place ne se gagnent jamais au doigt — et à deux, rien ne bouge.
   */
  describe('glisser au doigt jusqu’au bout de la liste', () => {
    // Lignes de 56 px séparées de 8 px, comme `min-h-14` + `gap-2`.
    const HAUTEUR = 56
    const PAS = 64

    const lignes = () =>
      within(screen.getByRole('list', { name: 'Ordre de passage' })).getAllByRole('listitem')

    const noms = () => lignes().map((ligne) => ligne.querySelector('.truncate')?.textContent)

    /** Une fausse mise en page : jsdom ne mesure rien, chaque ligne reçoit sa boîte. */
    const mettreEnPage = () => {
      lignes().forEach((ligne, rang) => {
        const top = rang * PAS
        ligne.getBoundingClientRect = () =>
          ({
            top,
            bottom: top + HAUTEUR,
            height: HAUTEUR,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => ({}),
          }) as DOMRect
      })
    }

    const glisser = (nom: string, rang: number, versY: number) => {
      mettreEnPage()
      const debut = rang * PAS + HAUTEUR / 2
      const options = { isPrimary: true, button: 0, pointerId: 7 }
      fireEvent.pointerDown(poignee(nom), { ...options, clientY: debut })
      fireEvent.pointerMove(poignee(nom), { ...options, clientY: versY })
      return () => fireEvent.pointerUp(poignee(nom), { ...options, clientY: versY })
    }

    const ouvrirOrdre = async (joueurs: readonly string[]) => {
      const contexte = await base(joueurs, joueurs)
      ouvrir(contexte.services, '/nouvelle-partie/x01/ordre')
      await screen.findByRole('list', { name: 'Ordre de passage' })
      return contexte
    }

    const memorise = (dependencies: Dependencies, ids: ReadonlyMap<string, PlayerId>) =>
      dependencies.devices.preferences
        .read<PlayerId[]>('partie:joueurs', [])
        .map((id) => [...ids].find(([, autre]) => autre === id)?.[0])

    it('à deux, fait passer le premier en dernier, puis le dernier en premier', async () => {
      const { dependencies, ids } = await ouvrirOrdre(['Kevin', 'Julien'])

      glisser('Kevin', 0, 5000)()
      expect(noms()).toEqual(['Julien', 'Kevin'])
      expect(memorise(dependencies as Dependencies, ids)).toEqual(['Julien', 'Kevin'])

      glisser('Kevin', 1, -5000)()
      expect(noms()).toEqual(['Kevin', 'Julien'])
      expect(memorise(dependencies as Dependencies, ids)).toEqual(['Kevin', 'Julien'])
    })

    it.each([
      [3, 'Kevin', 1, 'bas', ['Julien', 'Paul', 'Kevin']],
      [3, 'Paul', 3, 'haut', ['Paul', 'Kevin', 'Julien']],
      [3, 'Julien', 2, 'bas', ['Kevin', 'Paul', 'Julien']],
      [3, 'Julien', 2, 'haut', ['Julien', 'Kevin', 'Paul']],
      [4, 'Kevin', 1, 'bas', ['Julien', 'Paul', 'Marie', 'Kevin']],
      [4, 'Marie', 4, 'haut', ['Marie', 'Kevin', 'Julien', 'Paul']],
    ] as const)('à %i, dépose %s (n°%i) tout en %s', async (nombre, nom, numero, sens, attendu) => {
      const joueurs = ['Kevin', 'Julien', 'Paul', 'Marie'].slice(0, nombre)
      const { dependencies, ids } = await ouvrirOrdre(joueurs)

      // L'écran numérote depuis n°1 ; `glisser` attend l'index de la ligne.
      glisser(nom, numero - 1, sens === 'bas' ? 5000 : -5000)()

      expect(noms()).toEqual(attendu)
      expect(memorise(dependencies as Dependencies, ids)).toEqual(attendu)
    })

    it('écarte pendant le geste exactement les lignes que le relâcher enjambera', async () => {
      await ouvrirOrdre(['Kevin', 'Julien', 'Paul'])

      const relacher = glisser('Kevin', 0, 5000)
      // Kevin, tenu, suit le doigt jusqu'à la borne : deux pas plus bas.
      expect(lignes().map((ligne) => ligne.style.transform)).toEqual([
        `translateY(${2 * PAS}px)`,
        `translateY(-${PAS}px)`,
        `translateY(-${PAS}px)`,
      ])
      relacher()
      expect(noms()).toEqual(['Julien', 'Paul', 'Kevin'])
    })

    it('ne déplace rien sur un tap ni sur un mouvement de moins d’une demi-ligne', async () => {
      await ouvrirOrdre(['Kevin', 'Julien', 'Paul'])

      glisser('Kevin', 0, HAUTEUR / 2)()
      expect(noms()).toEqual(['Kevin', 'Julien', 'Paul'])

      glisser('Julien', 1, PAS + HAUTEUR / 2 + PAS / 2 - 1)()
      expect(noms()).toEqual(['Kevin', 'Julien', 'Paul'])

      glisser('Julien', 1, PAS + HAUTEUR / 2 - PAS / 2 + 1)()
      expect(noms()).toEqual(['Kevin', 'Julien', 'Paul'])
    })
  })

  it('renvoie à l’étape 2 sous deux joueurs, une fois les profils chargés', async () => {
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    expect(await screen.findByRole('heading', { level: 1, name: 'X01' })).toBeInTheDocument()
  })
})

describe('Nouvelle partie — joueurs', () => {
  /** Critère 6 : le × retire de la partie, jamais de la base. */
  it('retire un joueur de la partie sans le supprimer', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/x01')

    await utilisateur.click(
      await screen.findByRole('button', { name: 'Retirer Julien de la partie' }),
    )

    const rangee = screen.getByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).queryByText('Julien')).toBeNull()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
    expect(await services.managePlayers.listAll()).toHaveLength(2)
  })

  /** Sans joueur, rien à lancer : « Commencer » est grisé et l'état vide le dit. */
  it('grise « Commencer » à zéro joueur et le rallume dès qu’un joueur est ajouté', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    expect(await screen.findByText(AUCUN_JOUEUR_PARTIE)).toBeInTheDocument()
    expect(screen.getByText('0 / 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeDisabled()

    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Kevin/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    expect(await screen.findByText('1 / 4')).toBeInTheDocument()
    expect(screen.queryByText(AUCUN_JOUEUR_PARTIE)).toBeNull()
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeEnabled()
  })

  /** Le × garde sa zone d'appui de 48 px, à cheval sur le coin de la pastille. */
  it('garde un × de 48 px à cheval sur la pastille, nommé d’après le joueur', async () => {
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    const retirer = await screen.findByRole('button', { name: 'Retirer Kevin de la partie' })
    expect(retirer).toHaveClass('size-12', '-right-6', '-top-6')
  })

  /** Q4 : le pseudo reste sur une ligne, tronqué ; le nom complet vit dans le libellé du ×. */
  it('tronque un long pseudo sur une ligne, sans perdre le nom complet', async () => {
    const { services } = await base(['Alexandrine-Marie'], ['Alexandrine-Marie'])
    ouvrir(services, '/nouvelle-partie/x01')

    const rangee = await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).getByText('Alexandrine-Marie')).toHaveClass('truncate')
    expect(
      screen.getByRole('button', { name: 'Retirer Alexandrine-Marie de la partie' }),
    ).toBeInTheDocument()
  })

  /** Critère 2 : seul en piste, les trois étapes restent, Ordre grisé ; à deux, il s'allume. */
  it('grise l’étape Ordre sous deux joueurs, et pas à partir de deux', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    const etapes = () => within(screen.getByRole('list', { name: 'Étapes de la partie' }))
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(
      etapes()
        .getAllByRole('listitem')
        .map((e) => e.textContent),
    ).toEqual(['1 · Jeu', '2 · Joueurs', '3 · Ordre'])
    expect(etapes().getByText('1 · Jeu')).toHaveAttribute('data-etat', 'fait')
    expect(etapes().getByText('2 · Joueurs')).toHaveAttribute('aria-current', 'step')
    expect(etapes().getByText('3 · Ordre')).toHaveAttribute('data-etat', 'grise')
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('link', { name: 'Sélectionner un joueur existant' }))
    await utilisateur.click(await screen.findByRole('button', { name: /^Julien/ }))
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))

    expect(await screen.findByRole('button', { name: 'Continuer' })).toBeInTheDocument()
    expect(etapes().getByText('3 · Ordre')).toHaveAttribute('data-etat', 'avenir')
  })

  /** Critère 7 : la boîte crée et ajoute ; un pseudo pris affiche l'erreur actuelle. */
  it('crée un joueur depuis la boîte de dialogue, et refuse un pseudo pris', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    const ouvrirBoite = async () => {
      await utilisateur.click(screen.getByRole('button', { name: 'Ajouter un joueur' }))
      await utilisateur.click(screen.getByRole('button', { name: 'Nouveau joueur' }))
      return screen.getByRole('dialog', { name: 'Nouveau joueur' })
    }

    let boite = await ouvrirBoite()
    expect(screen.getByLabelText('Pseudo')).toHaveFocus()
    expect(within(boite).getByRole('button', { name: 'Terminé' })).toBeDisabled()
    await utilisateur.type(screen.getByLabelText('Pseudo'), 'Julien')
    await utilisateur.click(within(boite).getByRole('button', { name: 'Terminé' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const rangee = screen.getByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).getByText('Julien')).toBeInTheDocument()

    boite = await ouvrirBoite()
    await utilisateur.type(screen.getByLabelText('Pseudo'), 'Kevin')
    await utilisateur.click(within(boite).getByRole('button', { name: 'Terminé' }))

    expect(await within(boite).findByRole('alert')).toHaveTextContent('Ce pseudo est déjà pris.')
    expect(screen.getByRole('dialog', { name: 'Nouveau joueur' })).toBeInTheDocument()
    expect(await services.managePlayers.listAll()).toHaveLength(2)

    await utilisateur.click(within(boite).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('referme le menu « + » avec Échap', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')

    const plus = await screen.findByRole('button', { name: 'Ajouter un joueur' })
    await utilisateur.click(plus)
    expect(plus).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Nouveau joueur' })).toBeInTheDocument()

    await utilisateur.keyboard('{Escape}')
    expect(plus).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Nouveau joueur' })).toBeNull()
  })

  /** Critère 8 : quatre au plus ; « N manches » sous qui a joué au X01, rien sinon. */
  it('respecte le maximum de quatre joueurs et montre les manches jouées', async () => {
    const utilisateur = userEvent.setup()
    const { services, ids } = await base(['Kevin', 'Julien', 'Paul', 'Marie', 'Lea'])
    const kevin = ids.get('Kevin') as PlayerId
    const julien = ids.get('Julien') as PlayerId
    const matchId = await services.startMatch.execute({
      playerIds: [kevin, julien],
      config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
    })
    await services.recordVisit.execute({ matchId, darts: [Dart.double(20)] })

    ouvrir(services, '/nouvelle-partie/x01/joueurs')

    expect(await screen.findByRole('button', { name: /^Kevin/ })).toHaveTextContent('1 manche')
    expect(screen.getByRole('button', { name: /^Paul/ })).not.toHaveTextContent(/manche/)

    for (const nom of ['Kevin', 'Julien', 'Paul', 'Marie']) {
      await utilisateur.click(screen.getByRole('button', { name: new RegExp(`^${nom}`) }))
    }
    expect(screen.getByRole('button', { name: /^Lea/ })).toBeDisabled()
    // Un joueur retenu, lui, se décoche toujours.
    expect(screen.getByRole('button', { name: /^Marie/ })).toBeEnabled()

    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))
    expect(await screen.findByText('4 / 4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajouter un joueur' })).toBeNull()
  })
})

describe('Nouvelle partie — retour', () => {
  const jusquALOrdre = async (
    services: Services,
    utilisateur: ReturnType<typeof userEvent.setup>,
  ) => {
    renderWithServices(<App />, { services, route: '/' })
    await utilisateur.click(await screen.findByRole('link', { name: 'Nouvelle partie' }))
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await utilisateur.click(rail('Score de départ').getByRole('button', { name: '301' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(titre()).toHaveTextContent('Ordre de jeu')
  }

  /** Critère 13 : le retour du téléphone ramène à l'étape précédente, choix conservés. */
  it('remonte les étapes au retour du téléphone jusqu’à l’Accueil', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    await jusquALOrdre(services, utilisateur)

    await retourTelephone()
    expect(titre()).toHaveTextContent('X01')
    expect(rail('Score de départ').getByRole('button', { name: '301' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await retourTelephone()
    expect(titre()).toHaveTextContent('Nouvelle partie')

    await retourTelephone()
    expect(await screen.findByRole('heading', { name: /dartpéro/i })).toBeInTheDocument()
  })

  it('fait la même chose avec le bouton retour de l’écran', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    await jusquALOrdre(services, utilisateur)

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(titre()).toHaveTextContent('X01')
    expect(screen.getByText('2 / 4')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(titre()).toHaveTextContent('Nouvelle partie')

    await utilisateur.click(screen.getByRole('button', { name: 'Retour à l’accueil' }))
    expect(await screen.findByRole('heading', { name: /dartpéro/i })).toBeInTheDocument()
  })

  /** T4 : « Plus de réglages » est replié à chaque ouverture, retour depuis l'étape Ordre compris. */
  it('replie « Plus de réglages » au retour depuis l’étape Ordre', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    await jusquALOrdre(services, utilisateur)

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    const pli = screen.getByRole('button', { name: /plus de réglages/i })
    expect(pli).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * T8 (O1) : l'échec d'un démarrage ne concerne que l'étape où il a eu lieu.
   * Sans mock : le profil est supprimé derrière le dos de l'écran, dont le
   * cache des profils n'est pas invalidé — « Commencer » échoue pour de vrai.
   */
  it('efface l’erreur de démarrage quand on change d’étape', async () => {
    const utilisateur = userEvent.setup()
    const { services, ids } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/x01/ordre')
    await screen.findByRole('list', { name: 'Ordre de passage' })

    await services.managePlayers.remove(ids.get('Julien') as PlayerId)
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    expect(await screen.findByText('Impossible de démarrer la partie.')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(titre()).toHaveTextContent('X01')
    expect(screen.queryByText('Impossible de démarrer la partie.')).toBeNull()
  })

  it('remplace l’entrée par l’étape précédente quand on arrive par un lien profond', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, '/nouvelle-partie/cricket/ordre')

    await screen.findByRole('list', { name: 'Ordre de passage' })
    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(titre()).toHaveTextContent('Cricket')

    await utilisateur.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(titre()).toHaveTextContent('Nouvelle partie')
  })
})

describe('Nouvelle partie — gardes et mémoire', () => {
  it('renvoie un jeu inconnu à l’étape 1', async () => {
    const { services } = await base([])
    ouvrir(services, '/nouvelle-partie/killer')

    expect(await screen.findByRole('link', { name: /^X01/ })).toBeInTheDocument()
    expect(titre()).toHaveTextContent('Nouvelle partie')
  })

  it('rouvre sur la dernière formule jouée, joueurs compris', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])

    const premiere = ouvrir(services, '/nouvelle-partie/x01')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await utilisateur.click(rail('Score de départ').getByRole('button', { name: '301' }))
    await utilisateur.click(rail('Manches à gagner').getByRole('button', { name: '3' }))
    await deplierPlus(utilisateur)
    await utilisateur.click(rail('Sets à gagner').getByRole('button', { name: '2' }))
    premiere.unmount()

    ouvrir(services, '/nouvelle-partie/x01')
    const rangee = await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).getByText('Kevin')).toBeInTheDocument()
    expect(within(rangee).getByText('Julien')).toBeInTheDocument()
    // Replié à la réouverture, mais la préférence est bien relue.
    expect(screen.getByRole('button', { name: /plus de réglages/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await deplierPlus(utilisateur)
    for (const [legende, valeur] of [
      ['Score de départ', '301'],
      ['Manches à gagner', '3'],
      ['Sets à gagner', '2'],
    ] as const) {
      expect(rail(legende).getByRole('button', { name: valeur })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    }
  })

  /** T5 : les bascules, la variante et le nombre de checkouts survivent aussi. */
  it('mémorise sortie, entrée, variante et sorties', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    const pressee = (bouton: HTMLElement) => expect(bouton).toHaveAttribute('aria-pressed', 'true')

    let ecran = ouvrir(services, '/nouvelle-partie/x01')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await deplierPlus(utilisateur)
    await utilisateur.click(
      rail('Checkout').getByRole('button', { name: 'Checkout sur un double' }),
    )
    await utilisateur.click(rail('Entrée').getByRole('button', { name: 'Sur un double' }))
    ecran.unmount()

    ecran = ouvrir(services, '/nouvelle-partie/cricket')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await utilisateur.click(rail('Comptage').getByRole('button', { name: /^Cut-throat/ }))
    ecran.unmount()

    dependencies.devices.preferences.write('entrainement:joueur', null)
    ecran = ouvrir(services, '/nouvelle-partie/entrainement')
    await screen.findByText('0 / 1')
    await utilisateur.click(rail('Nombre de checkouts').getByRole('button', { name: '20' }))
    ecran.unmount()

    ecran = ouvrir(services, '/nouvelle-partie/x01')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    await deplierPlus(utilisateur)
    pressee(rail('Checkout').getByRole('button', { name: 'Checkout sur un double' }))
    pressee(rail('Entrée').getByRole('button', { name: 'Sur un double' }))
    ecran.unmount()

    ecran = ouvrir(services, '/nouvelle-partie/cricket')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    pressee(rail('Comptage').getByRole('button', { name: /^Cut-throat/ }))
    ecran.unmount()

    ouvrir(services, '/nouvelle-partie/entrainement')
    await screen.findByText('0 / 1')
    pressee(rail('Nombre de checkouts').getByRole('button', { name: '20' }))
  })

  /** Dette assumée : l'ancienne clé de l'interrupteur reste orpheline, sans effet. */
  it('ignore l’ancienne clé `partie:ordre-aleatoire` et n’en écrit plus', async () => {
    const utilisateur = userEvent.setup()
    const { services, dependencies } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    const preferences = (dependencies as Dependencies).devices.preferences
    preferences.write('partie:ordre-aleatoire', true)
    ouvrir(services, '/nouvelle-partie/x01/ordre')

    await screen.findByRole('list', { name: 'Ordre de passage' })
    // L'ordre n'est pas rebattu : la clé orpheline ne fait rien.
    expect(ordreAffiche()).toEqual(['Kevin', 'Julien'])
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))
    await screen.findAllByLabelText(/^Score restant de/)
    expect((await derniere(services)).players.map((joueur) => joueur.name)).toEqual([
      'Kevin',
      'Julien',
    ])
    expect(preferences.read('partie:ordre-aleatoire', null)).toBe(true)
  })

  /** Critère 5 : « Plus de réglages » replié, le récap suit chaque appui. */
  it('replie « Plus de réglages » par défaut, le déplie, et garde le récap à jour', async () => {
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, '/nouvelle-partie/x01')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })

    const pli = () => screen.getByRole('button', { name: /plus de réglages/i })
    expect(pli()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'Checkout' })).toBeNull()
    const recap = screen.getByLabelText('Réglages choisis')
    expect(recap).toHaveTextContent('501 · premier à 2 manches')
    expect(recap).toHaveTextContent('Checkout libre · Entrée libre · Sans sets')

    await utilisateur.click(rail('Score de départ').getByRole('button', { name: '301' }))
    expect(recap).toHaveTextContent('301 · premier à 2 manches')

    await utilisateur.click(pli())
    expect(pli()).toHaveAttribute('aria-expanded', 'true')
    await utilisateur.click(
      rail('Checkout').getByRole('button', { name: 'Checkout sur un double' }),
    )
    await utilisateur.click(rail('Sets à gagner').getByRole('button', { name: '2' }))
    expect(recap).toHaveTextContent('Checkout sur un double · Entrée libre · Premier à 2 sets')

    await utilisateur.click(pli())
    expect(pli()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'Checkout' })).toBeNull()
    // Replié, le récap continue de tout dire.
    expect(recap).toHaveTextContent('Checkout sur un double')
  })

  /**
   * Lot `regles-du-jeu` : « Les règles en entier » a quitté la fiche ; le livre de
   * l'en-tête ouvre la feuille de règles par-dessus l'étape, sans en sortir.
   */
  it.each(GAME_MODE_IDS)('ouvre la feuille de règles par le livre pour %s', async (mode) => {
    const nom = LIBELLE_MODE[mode]
    const regles = TITRE_REGLES[mode]
    const utilisateur = userEvent.setup()
    const { services } = await base(['Kevin'], ['Kevin'])
    ouvrir(services, `/nouvelle-partie/${SLUG_MODE[mode]}`)
    await screen.findByRole('list', { name: 'Joueurs de la partie' })

    expect(screen.queryByRole('button', { name: 'Les règles en entier' })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()

    await utilisateur.click(screen.getByRole('button', { name: regles }))
    const feuille = screen.getByRole('dialog', { name: regles })
    expect(titre()).toHaveTextContent(nom)
    expect(within(feuille).getByText('Ce soir')).toBeInTheDocument()

    await utilisateur.click(within(feuille).getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(titre()).toHaveTextContent(nom)
  })

  /** ⚠️ Un profil supprimé ne doit pas rester retenu en fantôme : le lancement échouerait. */
  it('oublie un joueur supprimé depuis la dernière partie', async () => {
    const { services, ids } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    await services.managePlayers.remove(ids.get('Julien') as PlayerId)

    ouvrir(services, '/nouvelle-partie/x01')
    const rangee = await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(within(rangee).getByText('Kevin')).toBeInTheDocument()
    expect(within(rangee).queryByText('Julien')).toBeNull()
  })

  it('retombe sur les défauts quand une préférence mémorisée sort des listes', async () => {
    const { services, dependencies } = await base(['Kevin'], ['Kevin'])
    const preferences = (dependencies as Dependencies).devices.preferences
    preferences.write('partie:score', 1001)
    preferences.write('partie:sets', 9)

    ouvrir(services, '/nouvelle-partie/x01')
    await screen.findByRole('list', { name: 'Joueurs de la partie' })
    expect(rail('Score de départ').getByRole('button', { name: '501' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: /plus de réglages/i }))
    expect(rail('Sets à gagner').getByRole('button', { name: 'Sans' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('Nouvelle partie — plein écran', () => {
  /** T3 : les étapes ne montrent pas la barre du bas — elle est bien là ailleurs. */
  it.each([
    '/nouvelle-partie',
    '/nouvelle-partie/x01',
    '/nouvelle-partie/x01/joueurs',
    '/nouvelle-partie/x01/ordre',
  ])('n’affiche aucune barre de navigation sur %s', async (route) => {
    const { services } = await base(['Kevin', 'Julien'], ['Kevin', 'Julien'])
    ouvrir(services, route)

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
  })

  it('garde la barre de navigation sur l’Accueil (témoin)', async () => {
    const { services } = await base([])
    ouvrir(services, '/')

    expect(
      await screen.findByRole('navigation', { name: 'Navigation principale' }),
    ).toBeInTheDocument()
  })
})

describe('Nouvelle partie — depuis un résumé', () => {
  /** T4 : « Changer les règles » / « Changer l’exercice » → étape 2 du mode qu’on vient de jouer. */
  it.each([
    ['X01', 'Changer les règles', 'X01'],
    ['CRICKET', 'Changer les règles', 'Cricket'],
    ['TOUR_DU_MONDE', 'Changer les règles', 'Tour du monde'],
    ['CHECKOUT_PRACTICE', 'Changer l’exercice', 'Entraînement'],
  ] as const)('le résumé %s mène à l’étape 2 du même jeu', async (mode, bouton, titreAttendu) => {
    const utilisateur = userEvent.setup()
    const { services, ids } = await base(['Kevin'], ['Kevin'])
    const kevin = ids.get('Kevin') as PlayerId
    const matchId = await (async () => {
      switch (mode) {
        case 'X01':
          return services.startMatch.execute({
            playerIds: [kevin],
            config: X01Config.create({ startingScore: 40, legsToWin: 1 }),
          })
        case 'CRICKET':
          return services.playCricket.start({
            playerIds: [kevin],
            config: CricketConfig.create(),
          })
        case 'TOUR_DU_MONDE':
          return services.playTourDuMonde.start({
            playerIds: [kevin],
            config: TourDuMondeConfig.create(),
          })
        case 'CHECKOUT_PRACTICE':
          return services.playCheckoutPractice.start({
            playerId: kevin,
            config: CheckoutPracticeConfig.create({ rounds: 5 }),
          })
      }
    })()

    ouvrir(services, `/partie/${matchId}/resume`)
    await utilisateur.click(await screen.findByRole('button', { name: bouton }))

    expect(await screen.findByRole('heading', { level: 1, name: titreAttendu })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Joueurs de la partie' })).toBeInTheDocument()
  })
})
