import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'

describe('App (scaffold)', () => {
  it("affiche l'enseigne Dartpéro", () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /dartpéro/i })).toBeInTheDocument()
  })

  it('rend le tableau de démonstration avec des scores lisibles', () => {
    render(<App />)
    const tableau = screen.getByLabelText('Aperçu du tableau')
    expect(tableau).toHaveTextContent('141')
    expect(tableau).toHaveTextContent('286')
  })
})
