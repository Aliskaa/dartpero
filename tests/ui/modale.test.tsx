import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modale } from '@/ui/composants/commun/Modale'

const boite = (ouvert: boolean, onFermer = vi.fn()) => (
  <>
    <button type="button">Origine</button>
    <Modale ouvert={ouvert} onFermer={onFermer} titre="Victoires" pictogramme="victoire">
      <p>Contenu de la liste</p>
    </Modale>
  </>
)

const dialogue = (container: HTMLElement) => container.querySelector('dialog') as HTMLDialogElement

describe('Modale — le <dialog> natif', () => {
  it('fermée : le dialogue est monté, mais ni ouvert ni rempli', () => {
    const { container, rerender } = render(boite(false))
    expect(dialogue(container)).not.toBeNull()
    expect(dialogue(container).open).toBe(false)
    expect(screen.queryByText('Contenu de la liste')).toBeNull()

    // Témoin : ouverte, le contenu est bien là.
    rerender(boite(true))
    expect(dialogue(container).open).toBe(true)
    expect(screen.getByText('Contenu de la liste')).toBeInTheDocument()
  })

  it('TM-2 : jamais de `display` (flex, grid, block, inline-*) sur le <dialog> lui-même', () => {
    const { container } = render(boite(false))
    const classes = dialogue(container).className.split(/\s+/)
    // Témoin : on lit bien la bonne liste de classes.
    expect(classes).toContain('m-auto')
    // Sans variante (`open:flex` resterait permis) : une classe de `display`
    // afficherait le `<dialog>` même fermé.
    const display =
      /^(?:flex|inline-flex|grid|inline-grid|block|inline-block|inline|contents|table)$/
    expect(classes.filter((classe) => display.test(classe))).toEqual([])
  })

  it('ouverte : un dialogue nommé par son titre, focus sur ✕', () => {
    render(boite(true))
    const boiteOuverte = screen.getByRole('dialog', { name: 'Victoires' })
    expect(boiteOuverte).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    // Le pictogramme est muet.
    expect(boiteOuverte.querySelector('svg[width="20"]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('✕ demande la fermeture, une fois', async () => {
    const onFermer = vi.fn()
    render(boite(true, onFermer))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('Échap (`cancel`) : annulé, puis relayé une fois', () => {
    const onFermer = vi.fn()
    const { container } = render(boite(true, onFermer))
    const annulation = new Event('cancel', { cancelable: true })
    fireEvent(dialogue(container), annulation)
    expect(annulation.defaultPrevented).toBe(true)
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('un `close` du navigateur pendant qu’elle est ouverte est relayé ; celui qu’on provoque, non', () => {
    const onFermer = vi.fn()
    const { container, rerender } = render(boite(true, onFermer))

    fireEvent(dialogue(container), new Event('close'))
    expect(onFermer).toHaveBeenCalledTimes(1)

    // Fermée par la prop : `close()` émet `close`, qui ne doit rien relayer.
    rerender(boite(false, onFermer))
    expect(dialogue(container).open).toBe(false)
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('un appui sur le voile (hors de la boîte) ferme, une fois', () => {
    const onFermer = vi.fn()
    const { container } = render(boite(true, onFermer))
    const d = dialogue(container)
    d.getBoundingClientRect = () => new DOMRect(20, 100, 300, 400)
    // Le voile renvoie ses appuis au `<dialog>` lui-même, hors de sa boîte.
    fireEvent.pointerDown(d, { clientX: 5, clientY: 50 })
    fireEvent.click(d, { clientX: 5, clientY: 50 })
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('un appui dans la boîte ne ferme pas — contenu ou bordure', () => {
    const onFermer = vi.fn()
    const { container } = render(boite(true, onFermer))
    const d = dialogue(container)
    d.getBoundingClientRect = () => new DOMRect(20, 100, 300, 400)

    // Sur le contenu : la cible n'est pas le `<dialog>`.
    const contenu = screen.getByText('Contenu de la liste')
    fireEvent.pointerDown(contenu, { clientX: 50, clientY: 200 })
    fireEvent.click(contenu, { clientX: 50, clientY: 200 })
    // Même hors du rectangle mesuré (un contenu qui déborde, une mesure en
    // retard) : c'est la cible qui décide d'abord, pas les coordonnées.
    fireEvent.pointerDown(contenu, { clientX: 5, clientY: 50 })
    fireEvent.click(contenu, { clientX: 5, clientY: 50 })
    // Sur la bordure : la cible est le `<dialog>`, mais le point est dans sa boîte.
    fireEvent.pointerDown(d, { clientX: 21, clientY: 101 })
    fireEvent.click(d, { clientX: 21, clientY: 101 })

    expect(onFermer).not.toHaveBeenCalled()
    expect(d.open).toBe(true)
  })

  it('un glisser parti de la boîte et lâché sur le voile ne ferme pas', () => {
    const onFermer = vi.fn()
    const { container } = render(boite(true, onFermer))
    const d = dialogue(container)
    d.getBoundingClientRect = () => new DOMRect(20, 100, 300, 400)

    fireEvent.pointerDown(screen.getByText('Contenu de la liste'), { clientX: 50, clientY: 200 })
    fireEvent.click(d, { clientX: 5, clientY: 50 })
    expect(onFermer).not.toHaveBeenCalled()
  })

  it('rend le focus à l’élément d’origine à la fermeture', () => {
    const { rerender } = render(boite(false))
    const origine = screen.getByRole('button', { name: 'Origine' })
    origine.focus()

    rerender(boite(true))
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()

    rerender(boite(false))
    expect(origine).toHaveFocus()
  })
})
