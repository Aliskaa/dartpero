import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { fakeServices } from '../fakes'
import { renderWithServices } from './renderWithServices'

/**
 * La politique de confidentialité et les mentions légales (`/confidentialite`),
 * l'URL publique donnée à la Play Console.
 *
 * ⚠️ Aucune assertion sur les valeurs des mentions légales : elles changent
 * avec l'éditeur ou l'hébergeur, pas avec le code. Un marqueur REMPLIR oublié
 * est bloqué par la garde de publication de `npm run smoke`, sur `dist/` —
 * pas par la suite de tests.
 */

const ouvrir = (route: string) =>
  renderWithServices(<App />, { services: fakeServices().services, route })

const titre = () => screen.findByRole('heading', { level: 1, name: 'Confidentialité' })

describe('Confidentialité — depuis les Réglages', () => {
  it('« Joueurs et appli » porte une ligne-lien vers /confidentialite', async () => {
    ouvrir('/reglages')

    const lien = await screen.findByRole('link', { name: 'Confidentialité et mentions légales' })
    expect(lien).toHaveAttribute('href', '/confidentialite')
    const groupe = screen.getByRole('region', { name: 'Joueurs et appli' })
    expect(groupe).toContainElement(lien)
  })

  it('le lien mène à la page, à travers les routes de l’app', async () => {
    ouvrir('/reglages')
    const utilisateur = userEvent.setup()

    await utilisateur.click(
      await screen.findByRole('link', { name: 'Confidentialité et mentions légales' }),
    )

    expect(await titre()).toBeInTheDocument()
  })
})

describe('Confidentialité — en accès direct', () => {
  it('affiche la politique, puis les mentions légales', async () => {
    ouvrir('/confidentialite')

    expect(await titre()).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Politique de confidentialité' }),
    ).toBeInTheDocument()
    for (const section of [
      'Sur votre appareil',
      'Garder la main',
      'Fonctions du téléphone',
      'Hébergement',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }

    const mentions = screen
      .getByRole('heading', { level: 2, name: 'Mentions légales' })
      .closest('section')
    expect(mentions).not.toBeNull()
    const dansMentions = within(mentions as HTMLElement)
    expect(dansMentions.getByText('Éditeur')).toBeInTheDocument()
    expect(dansMentions.getByText('Contact')).toBeInTheDocument()
    expect(dansMentions.getByText('Hébergeur')).toBeInTheDocument()
    expect(dansMentions.getByText('Firebase Hosting (Google)')).toBeInTheDocument()
  })

  it('le h1 n’est pas répété par un h2', async () => {
    ouvrir('/confidentialite')
    await titre()

    expect(screen.queryByRole('heading', { level: 2, name: 'Confidentialité' })).toBeNull()
  })

  it('donne sa date de mise à jour, une seule fois', async () => {
    ouvrir('/confidentialite')
    await titre()

    expect(screen.getAllByText('Mise à jour le 17 octobre 2026')).toHaveLength(1)
  })

  it('cite la date du dernier export, gardée dans le stockage local', async () => {
    ouvrir('/confidentialite')
    await titre()

    const section = screen
      .getByRole('heading', { level: 2, name: 'Sur votre appareil' })
      .closest('section') as HTMLElement
    const paragraphe = within(section).getByText(/stockage local du navigateur \(localStorage\)/)
    expect(paragraphe).toHaveTextContent(
      'le « Plus tard » de l’invitation à installer et la date du dernier export.',
    )
  })

  it('situe « Annoncer les volées » dans Réglages → Affichage, là où il est', async () => {
    ouvrir('/confidentialite')
    await titre()

    expect(
      screen.getByText(/coupez « Annoncer les volées » dans Réglages → Affichage\./),
    ).toBeInTheDocument()
  })

  it('cite le dernier joueur consulté dans Statistiques, gardé dans le stockage local', async () => {
    ouvrir('/confidentialite')
    await titre()

    const section = screen
      .getByRole('heading', { level: 2, name: 'Sur votre appareil' })
      .closest('section') as HTMLElement
    const paragraphe = within(section).getByText(/stockage local du navigateur \(localStorage\)/)
    expect(paragraphe).toHaveTextContent(
      'le dernier joueur consulté dans Statistiques (son identifiant interne)',
    )
  })

  it('dit que le nom donné à une partie est enregistré sur l’appareil', async () => {
    ouvrir('/confidentialite')
    await titre()

    const section = screen
      .getByRole('heading', { level: 2, name: 'Sur votre appareil' })
      .closest('section') as HTMLElement
    expect(within(section).getByText(/le nom que vous leur avez donné/)).toBeInTheDocument()
  })

  it('décrit l’export, l’import et l’effacement', async () => {
    ouvrir('/confidentialite')
    await titre()

    const section = screen
      .getByRole('heading', { level: 2, name: 'Garder la main' })
      .closest('section') as HTMLElement
    expect(within(section).getByText(/^Exporter :/)).toBeInTheDocument()
    expect(within(section).getByText(/^Importer :/)).toBeInTheDocument()
    expect(within(section).getByText(/^Effacer :/)).toBeInTheDocument()
  })

  it('dit comment couper l’annonce vocale', async () => {
    ouvrir('/confidentialite')
    await titre()

    expect(screen.getByText(/coupez « Annoncer les volées »/)).toBeInTheDocument()
  })

  it('ramène aux réglages', async () => {
    ouvrir('/confidentialite')
    const utilisateur = userEvent.setup()
    await titre()

    const retour = screen.getByRole('link', { name: 'Retour aux réglages' })
    expect(retour).toHaveAttribute('href', '/reglages')
    await utilisateur.click(retour)

    expect(await screen.findByRole('heading', { level: 1, name: 'Réglages' })).toBeInTheDocument()
  })

  it('garde la barre de navigation', async () => {
    ouvrir('/confidentialite')
    await titre()

    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  })
})
