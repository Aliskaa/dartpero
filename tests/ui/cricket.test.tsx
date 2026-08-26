import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import type { Services } from '@/composition/container'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { fakeServices } from '../fakes'
import { flechette } from './gestes'
import { renderWithServices } from './renderWithServices'

/** Trois cibles, pour qu'une partie complète tienne en quelques clics. */
const COURT = CricketConfig.create({ targets: [20, 19, 'BULL'] })
const CUT = CricketConfig.create({ targets: [20, 19, 'BULL'], variant: 'CUT_THROAT' })

const partieCourte = async (services: Services, config = COURT) => {
  const kevin = await services.managePlayers.create('Kevin')
  const julien = await services.managePlayers.create('Julien')

  const matchId = await services.playCricket.start({
    playerIds: [kevin.id, julien.id],
    config,
  })
  return { kevin, julien, matchId }
}

const pointsDe = (nom: string) => screen.getByLabelText(`Points de ${nom}`)

describe('Cricket — écran de jeu', () => {
  it('pose les marques et compte les points dès la fléchette saisie', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    // Un triple ferme la cible d'un coup, et le tableau le montre tout de suite.
    await flechette(utilisateur, '20', 'Triple')
    expect(screen.getByText('20 : fermée')).toBeInTheDocument()
    expect(pointsDe('Kevin')).toHaveTextContent('0')

    // La cible est fermée : ce qui suit se transforme en points.
    await flechette(utilisateur, '20', 'Triple')
    expect(pointsDe('Kevin')).toHaveTextContent('60')
  })

  it('fait retomber le multiplicateur sur Simple après chaque fléchette', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    await utilisateur.click(screen.getByRole('button', { name: 'Triple' }))
    expect(screen.getByRole('button', { name: 'Triple' })).toHaveAttribute('aria-pressed', 'true')

    await utilisateur.click(screen.getByRole('button', { name: '19' }))
    expect(screen.getByRole('button', { name: 'Simple' })).toHaveAttribute('aria-pressed', 'true')
  })

  /** Dix-neuf secteurs ne servent à rien ici : les proposer ferait douter. */
  it('ne propose que les sept cibles du jeu', async () => {
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    const pave = await screen.findByRole('region', { name: 'Saisie des cibles touchées' })

    expect(within(pave).getByRole('button', { name: '20' })).toBeInTheDocument()
    expect(within(pave).getByRole('button', { name: 'Bulle' })).toBeInTheDocument()
    expect(within(pave).queryByRole('button', { name: '14' })).toBeNull()
    expect(within(pave).queryByRole('button', { name: '1' })).toBeNull()
  })

  it('retire la dernière fléchette saisie quand on annule', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    await flechette(utilisateur, '20', 'Triple')
    expect(screen.getByText('20 : fermée')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: /^Annuler/ }))
    await waitFor(() => expect(screen.queryByText('20 : fermée')).toBeNull())
  })

  it('passe la main après trois fléchettes', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))

    await waitFor(() => expect(pointsDe('Julien').closest('[aria-current]')).not.toBeNull())
  })

  /**
   * Le vrai apport du port d'aperçu : la partie peut se gagner sur la deuxième
   * fléchette, et l'écran ne doit pas rester à réclamer la troisième.
   */
  it('conclut sur la fléchette qui gagne, sans réclamer la suivante', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    // Kevin ferme le 20 et le 19, puis rend la main.
    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '19', 'Triple')
    await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))

    for (const _ of [0, 1, 2]) await utilisateur.click(screen.getByRole('button', { name: 'Hors' }))
    await waitFor(() => expect(pointsDe('Kevin').closest('[aria-current]')).not.toBeNull())

    // La bulle en deux fléchettes : tout est fermé, la partie est jouée.
    await flechette(utilisateur, 'Bulle', 'Double')
    await utilisateur.click(screen.getByRole('button', { name: 'Bulle' }))

    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kevin' })).toBeInTheDocument()
  })

  it('affiche le cut-throat pour ce qu’il est : les points partent chez l’adversaire', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services, CUT)

    renderWithServices(<App />, { services, route: `/partie/${matchId}` })
    await waitFor(() => expect(pointsDe('Kevin')).toHaveTextContent('0'))

    expect(screen.getByText('Le plus bas gagne')).toBeInTheDocument()

    await flechette(utilisateur, '20', 'Triple')
    await flechette(utilisateur, '20', 'Triple')

    expect(pointsDe('Kevin')).toHaveTextContent('0')
    expect(pointsDe('Julien')).toHaveTextContent('60')
  })
})

describe('Cricket — création et historique', () => {
  it('propose le comptage à la création, puis démarre dans le bon mode', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/nouvelle-partie' })

    await utilisateur.type(await screen.findByLabelText('Nouveau joueur'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /kevin/i })).toBeInTheDocument())

    await utilisateur.click(screen.getByRole('button', { name: /Cricket/i }))

    const regles = screen.getByRole('region', { name: 'Règles' })
    expect(within(regles).getByRole('button', { name: 'Cut-throat' })).toBeInTheDocument()
    // Les réglages X01 n'ont rien à faire ici.
    expect(within(regles).queryByRole('button', { name: '501' })).toBeNull()

    await utilisateur.click(within(regles).getByRole('button', { name: 'Cut-throat' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    expect(await screen.findByLabelText('Points de Kevin')).toBeInTheDocument()

    const historique = await services.getMatchHistory.execute()
    expect(historique[0]?.mode).toBe('CRICKET')
  })

  it('apparaît dans l’historique avec ses cibles fermées et ses points', async () => {
    const { services } = fakeServices()
    const { matchId } = await partieCourte(services)
    await services.playCricket.recordVisit(matchId, [
      { segment: 20, multiplier: 'TRIPLE' },
      { segment: 20, multiplier: 'SIMPLE' },
    ])

    renderWithServices(<App />, { services, route: '/historique' })

    const parties = await screen.findAllByRole('listitem')
    const libelles = parties.map((partie) => partie.textContent ?? '')

    expect(libelles.some((texte) => texte.includes('Cricket Standard'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('1/3'))).toBe(true)
    expect(libelles.some((texte) => texte.includes('20'))).toBe(true)
  })
})
