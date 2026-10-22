import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createServices, type Services } from '@/composition/container'
import type { Announcer } from '@/core/application/ports/driven/Announcer'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { Dart, type SegmentNumber } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { GARDE_APRES_FERMETURE_MS } from '@/ui/hooks/useConfirmationSortie'
import { phraseVictoire } from '@/ui/labels'
import { DepotCompteur, fakeDependencies, SettableClock } from '../fakes'
import { flechette, validerSortie } from './gestes'
import { renderWithServices } from './renderWithServices'

const banc = () => {
  const dites: string[] = []
  const announcer: Announcer = {
    say: (annonce) => dites.push(annonce.map((segment) => segment.texte).join('')),
    cancel: () => {},
  }
  const clock = new SettableClock()
  const matches = new DepotCompteur()
  const base = fakeDependencies({ clock, matches })
  const dependencies = { ...base, devices: { ...base.devices, announcer } }
  return { dites, clock, matches, dependencies, services: createServices(dependencies) }
}

type Joueur = {
  readonly nom: string
  readonly numero: SegmentNumber
  readonly genre?: PlayerGender
}

const KEVIN: Joueur = { nom: 'Kevin', numero: 17 }
const JULIEN: Joueur = { nom: 'Julien', numero: 8 }
const SARAH: Joueur = { nom: 'Sarah', numero: 12, genre: 'FEMININE' }

const killer = async (
  services: Services,
  joueurs: readonly Joueur[],
  config = KillerConfig.create(),
): Promise<MatchId> => {
  const ids = []
  for (const joueur of joueurs) {
    ids.push((await services.managePlayers.create(joueur.nom, undefined, joueur.genre)).id)
  }
  return services.playKiller.start({
    playerIds: ids,
    config,
    numbers: joueurs.map((joueur) => joueur.numero),
  })
}

const ouvrir = (services: Services, matchId: MatchId) =>
  renderWithServices(<App />, { services, route: `/partie/${matchId}` })

const ligne = (nom: string): HTMLElement => {
  const article = screen.getByLabelText(`Numéro de ${nom}`).closest('article')
  if (!article) throw new Error(`ligne de ${nom} introuvable`)
  return article
}
const actif = (nom: string) => ligne(nom).getAttribute('aria-current') === 'true'
const vies = (nom: string) => screen.getByLabelText(`Vies de ${nom}`)
const volee = (nom: string) => screen.getByLabelText(`Volée de ${nom}`)
const boite = () => screen.queryByRole('dialog')
const resumeAffiche = () =>
  waitFor(() => expect(screen.getAllByText('Numéro').length).toBeGreaterThan(0), {
    timeout: 3000,
  })
const evenements = async (matches: DepotCompteur, id: MatchId) =>
  (await matches.findById(id))?.events.length ?? 0

describe('Killer — l’écran pendant la volée', () => {
  it('chaque fléchette écrit son effet, et les lignes suivent avant l’écriture', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matches } = banc()
    const id = await killer(services, [KEVIN, JULIEN])
    ouvrir(services, id)
    await screen.findByLabelText('Numéro de Kevin')
    expect(actif('Kevin')).toBe(true)
    expect(within(ligne('Kevin')).getByText('Vise')).toBeInTheDocument()
    expect(within(ligne('Kevin')).getByText('D17')).toBeInTheDocument()
    const journal = await evenements(matches, id)

    await flechette(utilisateur, '5')
    expect(volee('Kevin')).toHaveTextContent('S5 sans effet')

    await flechette(utilisateur, '17', 'Double')
    expect(volee('Kevin')).toHaveTextContent('D17 Killer !')
    expect(within(ligne('Kevin')).getByText('Killer')).toBeInTheDocument()
    expect(within(ligne('Kevin')).queryByText('Vise')).toBeNull()
    expect(await evenements(matches, id)).toBe(journal)
    expect(dites).toEqual([])

    await flechette(utilisateur, '8')
    await waitFor(async () => expect(await evenements(matches, id)).toBe(journal + 1))
    expect(volee('Kevin')).toHaveTextContent('S8 Julien −1')
    expect(vies('Julien')).toHaveTextContent('2 vies, 1 perdue')
    expect(actif('Julien')).toBe(true)
    expect(dites).toEqual(['Kevin devient killer. À toi, Julien'])
  })

  it('un non-killer sur le numéro d’un adversaire, la bulle et Hors : sans effet', async () => {
    const utilisateur = userEvent.setup()
    const { services } = banc()
    const id = await killer(services, [KEVIN, JULIEN])
    ouvrir(services, id)
    await screen.findByLabelText('Numéro de Kevin')

    await flechette(utilisateur, '8', 'Triple')
    await flechette(utilisateur, 'Bulle')
    expect(volee('Kevin')).toHaveTextContent('T8 sans effet')
    expect(volee('Kevin')).toHaveTextContent('25 sans effet')
    expect(vies('Julien')).toHaveTextContent('3 vies')
  })
})

describe('Killer — la boîte « Valider la sortie »', () => {
  const auBord = async (joueurs: readonly Joueur[] = [KEVIN, JULIEN]) => {
    const outils = banc()
    const id = await killer(outils.services, joueurs)
    await outils.services.playKiller.recordVisit(id, [
      Dart.double(17),
      Dart.single(1),
      Dart.single(1),
    ])
    for (let rang = 1; rang < joueurs.length; rang += 1) {
      await outils.services.playKiller.recordVisit(id, [
        Dart.single(1),
        Dart.single(1),
        Dart.single(1),
      ])
    }
    ouvrir(outils.services, id)
    await waitFor(() => expect(actif('Kevin')).toBe(true))
    return { ...outils, id }
  }

  it('au nom du gagnant ; rien d’écrit ni de dit avant de valider ; puis un seul énoncé', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matches, id } = await auBord()
    const journal = await evenements(matches, id)

    await flechette(utilisateur, '8', 'Triple')
    const dialogue = await screen.findByRole('dialog', { name: 'Kevin gagne sur T8 ?' })
    expect(dialogue).toHaveTextContent(
      'Julien est éliminé. Kevin est le dernier en vie : la partie est gagnée dès que vous validez.',
    )
    expect(volee('Kevin')).toHaveTextContent('T8 Julien éliminé')
    expect(await evenements(matches, id)).toBe(journal)
    expect(dites).toEqual([])

    await validerSortie(utilisateur)
    await waitFor(async () => expect(await evenements(matches, id)).toBe(journal + 1))
    await waitFor(() => expect(dites).toEqual([`Julien est éliminé. ${phraseVictoire(id)}`]))

    await resumeAffiche()
    expect(screen.getByText('Dernier en vie · 3 vies')).toBeInTheDocument()
    expect(screen.getByText('Éliminé par Kevin')).toBeInTheDocument()
    expect((await services.playKiller.getState(id)).finished).toBe(true)
  })

  it('Corriger retire la fléchette gagnante : Julien revit, la volée reprend', async () => {
    const utilisateur = userEvent.setup()
    const { clock, dites, matches, id } = await auBord()
    const journal = await evenements(matches, id)

    await flechette(utilisateur, '8', 'Triple')
    await screen.findByRole('dialog')
    await utilisateur.click(screen.getByRole('button', { name: 'Corriger' }))

    await waitFor(() => expect(boite()).toBeNull())
    expect(vies('Julien')).toHaveTextContent('3 vies')
    expect(within(ligne('Julien')).queryByText('Éliminé')).toBeNull()
    expect(screen.getByRole('button', { name: 'Annuler S1 de Julien' })).toBeDisabled()
    expect(await evenements(matches, id)).toBe(journal)
    expect(dites).toEqual([])

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await flechette(utilisateur, '8')
    expect(vies('Julien')).toHaveTextContent('2 vies, 1 perdue')
    await flechette(utilisateur, '1')
    await flechette(utilisateur, '1')
    await waitFor(() => expect(dites).toHaveLength(1))
  })

  it('Échap, puis un appui sur le voile : comme Corriger', async () => {
    const utilisateur = userEvent.setup()
    const { clock, matches, id } = await auBord()
    const journal = await evenements(matches, id)

    await flechette(utilisateur, '8', 'Triple')
    const premier = await screen.findByRole('dialog')
    act(() => {
      premier.dispatchEvent(new Event('cancel', { cancelable: true }))
    })
    await waitFor(() => expect(boite()).toBeNull())
    expect(vies('Julien')).toHaveTextContent('3 vies')

    clock.regler(clock.now() + GARDE_APRES_FERMETURE_MS)
    await flechette(utilisateur, '8', 'Double')
    expect(vies('Julien')).toHaveTextContent('1 vie, 2 perdues')
    await flechette(utilisateur, '8')
    const second = await screen.findByRole('dialog', { name: 'Kevin gagne sur S8 ?' })
    fireEvent.pointerDown(second, { clientX: 300, clientY: 600 })
    fireEvent.click(second, { clientX: 300, clientY: 600 })
    await waitFor(() => expect(boite()).toBeNull())
    expect(vies('Julien')).toHaveTextContent('1 vie, 2 perdues')
    expect(await evenements(matches, id)).toBe(journal)
  })

  it('accord : « Sarah est éliminée » dans la boîte, puis « Éliminée par Kevin »', async () => {
    const utilisateur = userEvent.setup()
    const { dites, id } = await auBord([KEVIN, SARAH])

    await flechette(utilisateur, '12', 'Triple')
    const dialogue = await screen.findByRole('dialog', { name: 'Kevin gagne sur T12 ?' })
    expect(dialogue).toHaveTextContent('Sarah est éliminée.')
    expect(volee('Kevin')).toHaveTextContent('T12 Sarah éliminée')

    await validerSortie(utilisateur)
    await resumeAffiche()
    expect(screen.getByText('Éliminée par Kevin')).toBeInTheDocument()
    expect(dites).toEqual([`Sarah est éliminée. ${phraseVictoire(id)}`])
  })
})

describe('Killer — élimination en cours de partie', () => {
  it('trois joueurs : la pastille s’accorde, l’éliminée est sautée, « À toi » gardé', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matches } = banc()
    const id = await killer(services, [KEVIN, SARAH, JULIEN])
    await services.playKiller.recordVisit(id, [Dart.double(17), Dart.single(1), Dart.single(1)])
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    ouvrir(services, id)
    await waitFor(() => expect(actif('Kevin')).toBe(true))
    expect(screen.getByLabelText('Joueurs en vie')).toHaveTextContent('3 en vie')

    await flechette(utilisateur, '12', 'Triple')
    expect(boite()).toBeNull()
    expect(within(ligne('Sarah')).getByText('Éliminée')).toBeInTheDocument()
    expect(screen.getByLabelText('Joueurs en vie')).toHaveTextContent('2 en vie')

    await flechette(utilisateur, '1')
    await flechette(utilisateur, '1')
    await waitFor(async () => expect(await evenements(matches, id)).toBe(5))
    await waitFor(() => expect(actif('Julien')).toBe(true))
    expect(dites).toEqual(['Sarah est éliminée. À toi, Julien'])
  })

  it('variante : l’auto-élimination s’enregistre sans boîte, « Éliminé » seul au résumé', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, matches } = banc()
    const id = await killer(
      services,
      [KEVIN, JULIEN, SARAH],
      KillerConfig.create({ selfHitCostsLives: true }),
    )
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    ouvrir(services, id)
    await waitFor(() => expect(actif('Julien')).toBe(true))

    await flechette(utilisateur, '8', 'Double')
    await flechette(utilisateur, '8', 'Triple')
    await waitFor(async () => expect(await evenements(matches, id)).toBe(3))
    expect(boite()).toBeNull()
    expect(volee('Julien')).toHaveTextContent('T8 Julien éliminé')
    expect(within(ligne('Julien')).getByText('Éliminé')).toBeInTheDocument()
    await waitFor(() => expect(actif('Sarah')).toBe(true))
    expect(dites).toEqual(['Julien devient killer. Julien est éliminé. À toi, Sarah'])
  })

  it('variante : Annuler défait l’auto-élimination, Julien rejoue sa volée', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const id = await killer(
      services,
      [KEVIN, JULIEN, SARAH],
      KillerConfig.create({ selfHitCostsLives: true }),
    )
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.triple(8)])
    ouvrir(services, id)
    await waitFor(() => expect(actif('Sarah')).toBe(true))
    expect(within(ligne('Julien')).getByText('Éliminé')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Annuler T8 de Julien' }))

    await waitFor(() => expect(actif('Julien')).toBe(true))
    expect(within(ligne('Julien')).queryByText('Éliminé')).toBeNull()
    expect(vies('Julien')).toHaveTextContent('3 vies')
    expect(within(ligne('Julien')).getByText('Killer')).toBeInTheDocument()
    expect((await services.playKiller.getState(id)).eliminations).toEqual([])
    expect(dites).toEqual([])
  })

  it('variante : le dernier killer s’élimine, la boîte dit que l’adversaire gagne', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const id = await killer(
      services,
      [KEVIN, JULIEN],
      KillerConfig.create({ selfHitCostsLives: true }),
    )
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    ouvrir(services, id)
    await waitFor(() => expect(actif('Julien')).toBe(true))

    await flechette(utilisateur, '8', 'Double')
    await flechette(utilisateur, '8', 'Triple')
    const dialogue = await screen.findByRole('dialog', { name: 'Kevin gagne ?' })
    expect(dialogue).toHaveTextContent(
      'Julien touche son propre numéro (T8) et est éliminé. Kevin est le dernier en vie',
    )
    expect(dites).toEqual([])

    await validerSortie(utilisateur)
    await resumeAffiche()
    expect(screen.getByText('Éliminé')).toBeInTheDocument()
    expect(screen.queryByText(/Éliminé par/)).toBeNull()
    expect(dites).toEqual([`Julien devient killer. Julien est éliminé. ${phraseVictoire(id)}`])
  })
})

describe('Killer — profil supprimé, de bout en bout', () => {
  const supprimer = async (services: Services, nom: string, genre?: PlayerGender) => {
    const profil = (await services.managePlayers.listAll()).find((p) => p.name === nom)
    if (!profil) throw new Error(`profil ${nom} absent`)
    expect(profil.gender).toBe(genre)
    await services.managePlayers.remove(profil.id)
  }

  it('à l’écran : « Joueur supprimé », « Éliminé » au masculin, même pour Sarah', async () => {
    const { services } = banc()
    const id = await killer(services, [KEVIN, SARAH, JULIEN])
    await services.playKiller.recordVisit(id, [Dart.double(17), Dart.triple(12)])
    await supprimer(services, 'Sarah', 'FEMININE')
    ouvrir(services, id)

    await waitFor(() => expect(actif('Julien')).toBe(true))
    const supprime = ligne('Joueur supprimé')
    expect(within(supprime).getByText('Éliminé')).toBeInTheDocument()
    expect(within(supprime).queryByText('Éliminée')).toBeNull()
  })

  it('au résumé : « Éliminé par Joueur supprimé », au masculin', async () => {
    const { services } = banc()
    const id = await killer(services, [KEVIN, SARAH, JULIEN])
    await services.playKiller.recordVisit(id, [Dart.double(17), Dart.triple(12)])
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
    await services.playKiller.recordVisit(id, [Dart.triple(8)])
    expect((await services.playKiller.getState(id)).finished).toBe(true)
    await supprimer(services, 'Sarah', 'FEMININE')
    await supprimer(services, 'Kevin')
    ouvrir(services, id)

    await resumeAffiche()
    expect(screen.getAllByText('Éliminé par Joueur supprimé')).toHaveLength(2)
    expect(screen.queryByText(/Éliminée/)).toBeNull()
  })
})

describe('Killer — rechargement et annulation', () => {
  it('rechargement : killer et effets reviennent, la boîte aussi, rien n’est dit', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites, dependencies } = banc()
    const id = await killer(services, [KEVIN, JULIEN])
    await services.playKiller.recordVisit(id, [Dart.double(17), Dart.single(1), Dart.single(1)])
    await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])

    const avant = ouvrir(services, id)
    await waitFor(() => expect(actif('Kevin')).toBe(true))
    await flechette(utilisateur, '8', 'Double')
    await flechette(utilisateur, '8')
    await screen.findByRole('dialog', { name: 'Kevin gagne sur S8 ?' })
    dites.length = 0
    await waitFor(async () =>
      expect((await dependencies.visitDrafts.findById(id))?.darts ?? []).toHaveLength(2),
    )
    avant.unmount()

    ouvrir(services, id)
    expect(await screen.findByRole('dialog', { name: 'Kevin gagne sur S8 ?' })).toBeInTheDocument()
    expect(volee('Kevin')).toHaveTextContent('D8 Julien −2')
    expect(volee('Kevin')).toHaveTextContent('S8 Julien éliminé')
    expect(dites).toEqual([])
  })

  it('Annuler défait l’élimination, puis le killer, fléchette par fléchette', async () => {
    const utilisateur = userEvent.setup()
    const { services, dites } = banc()
    const id = await killer(services, [KEVIN, JULIEN, SARAH])
    await services.playKiller.recordVisit(id, [Dart.double(17), Dart.triple(8), Dart.single(1)])
    ouvrir(services, id)
    await waitFor(() => expect(actif('Sarah')).toBe(true))
    expect(within(ligne('Julien')).getByText('Éliminé')).toBeInTheDocument()
    expect(dites).toEqual([])

    await utilisateur.click(screen.getByRole('button', { name: 'Annuler S1 de Kevin' }))
    await waitFor(() => expect(actif('Kevin')).toBe(true))
    expect(within(ligne('Julien')).getByText('Éliminé')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Annuler T8 de Kevin' }))
    expect(within(ligne('Julien')).queryByText('Éliminé')).toBeNull()
    expect(vies('Julien')).toHaveTextContent('3 vies')
    expect(within(ligne('Kevin')).getByText('Killer')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Annuler D17 de Kevin' }))
    expect(within(ligne('Kevin')).getByText('Vise')).toBeInTheDocument()
    expect((await services.playKiller.getState(id)).history).toHaveLength(0)
    expect(dites).toEqual([])

    await flechette(utilisateur, '1')
    await flechette(utilisateur, '1')
    await flechette(utilisateur, '1')
    await waitFor(() => expect(dites).toHaveLength(1))
  })
})
