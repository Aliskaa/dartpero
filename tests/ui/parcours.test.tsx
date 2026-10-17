import { screen, waitFor, within } from '@testing-library/react'
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
    expect(screen.queryByRole('link', { name: /Reprendre/ })).not.toBeInTheDocument()

    await utilisateur.click(screen.getByRole('link', { name: /nouvelle partie/i }))

    // --- Étape 1 : le jeu ---
    await utilisateur.click(await screen.findByRole('link', { name: /^X01/ }))

    // --- Étape 2 : on crée un joueur à la volée ---
    await utilisateur.click(await screen.findByRole('button', { name: 'Ajouter un joueur' }))
    await utilisateur.click(screen.getByRole('button', { name: 'Nouveau joueur' }))
    await utilisateur.type(screen.getByLabelText('Pseudo'), 'Kevin')
    await utilisateur.click(screen.getByRole('button', { name: 'Terminé' }))
    const rangee = screen.getByRole('list', { name: 'Joueurs de la partie' })
    await waitFor(() => expect(within(rangee).getByText('Kevin')).toBeInTheDocument())

    // Une seule manche à gagner, et le double out (décoché par défaut) activé.
    const manches = within(screen.getByRole('group', { name: 'Manches à gagner' }))
    await utilisateur.click(manches.getByRole('button', { name: '1' }))
    await utilisateur.click(screen.getByRole('button', { name: /plus de réglages/i }))
    const sortie = within(screen.getByRole('group', { name: 'Checkout' }))
    await utilisateur.click(sortie.getByRole('button', { name: 'Checkout sur un double' }))
    // Seul en piste : pas d'étape d'ordre, on commence d'ici.
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

    // 501 points en 9 fléchettes : la manche la plus courte possible.
    expect(screen.getByText('Meilleure manche').nextElementSibling).toHaveTextContent('9')
    expect(screen.getByText('Plus haut checkout').nextElementSibling).toHaveTextContent('141')
    // La moyenne et le « first 9 » valent tous deux 167 sur une manche de 9 fléchettes.
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

    const carte = await screen.findByRole('link', { name: /Reprendre/ })
    expect(carte).toHaveAttribute('href', expect.stringMatching(/^\/partie\/[^/]+$/))
    expect(carte).toHaveTextContent('X01')
    expect(carte).toHaveTextContent('501 · premier à 2 manches')
  })
})
