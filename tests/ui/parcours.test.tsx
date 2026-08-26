import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { X01Config } from '@/core/domain/games/x01/config'
import { fakeServices } from '../fakes'
import { flechette } from './gestes'
import { renderWithServices } from './renderWithServices'

describe('Parcours complet', () => {
  it('crée une partie depuis l’accueil et la joue jusqu’au résumé', async () => {
    const utilisateur = userEvent.setup()
    const { services } = fakeServices()
    renderWithServices(<App />, { services, route: '/' })

    // --- Accueil : aucune partie en cours ---
    expect(await screen.findByRole('heading', { name: /dartpéro/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reprendre' })).not.toBeInTheDocument()

    await utilisateur.click(screen.getByRole('link', { name: /nouvelle partie/i }))

    // --- Configuration : on crée un joueur à la volée ---
    await utilisateur.type(await screen.findByLabelText('Nouveau joueur'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /kevin/i })).toBeInTheDocument())

    await utilisateur.click(screen.getByRole('button', { name: '1' })) // best-of 1 leg
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer' }))

    // --- Match : 180, 180, puis sortie sur 141 ---
    // Le multiplicateur retombe sur Simple après chaque fléchette : chaque
    // triple se re-sélectionne, c'est ce que fait le helper `flechette`.
    const score = () => screen.getByLabelText('Score restant de Kevin')
    await waitFor(() => expect(score()).toHaveTextContent('501'))

    for (const _ of [0, 1, 2]) await flechette(utilisateur, '20', 'Triple')
    await waitFor(() => expect(score()).toHaveTextContent('321'))

    for (const _ of [0, 1, 2]) await flechette(utilisateur, '20', 'Triple')
    await waitFor(() => expect(score()).toHaveTextContent('141'))

    await flechette(utilisateur, '20', 'Triple') // T20 → 81
    await flechette(utilisateur, '19', 'Triple') // T19 → 24
    await flechette(utilisateur, '12', 'Double') // D12 → sortie

    // --- Résumé : l'écran de fin arrive tout seul ---
    expect(await screen.findByText('Vainqueur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kevin' })).toBeInTheDocument()

    // 501 points en 9 fléchettes : le leg le plus court possible.
    expect(screen.getByText('Meilleur leg').nextElementSibling).toHaveTextContent('9')
    expect(screen.getByText('Plus haut checkout').nextElementSibling).toHaveTextContent('141')
    // La moyenne et le « first 9 » valent tous deux 167 sur un leg de 9 fléchettes.
    expect(screen.getAllByText('167,0')).toHaveLength(2)

    // --- « On remet ça » : même joueur, mêmes règles, un tap ---
    // C'était le geste manquant : le seul bouton offert renvoyait sur un
    // formulaire de configuration remis à zéro.
    await utilisateur.click(screen.getByRole('button', { name: /on remet ça/i }))

    await waitFor(() => expect(score()).toHaveTextContent('501'))
    expect(screen.queryByText('Vainqueur')).not.toBeInTheDocument()
  })

  it('propose de reprendre une partie déjà commencée', async () => {
    const { services } = fakeServices()
    const kevin = await services.managePlayers.create('Kevin')
    await services.startMatch.execute({
      playerIds: [kevin.id],
      config: X01Config.create(),
    })

    renderWithServices(<App />, { services, route: '/' })

    expect(await screen.findByRole('button', { name: 'Reprendre' })).toBeInTheDocument()
    expect(screen.getByText('501')).toBeInTheDocument()
  })
})
