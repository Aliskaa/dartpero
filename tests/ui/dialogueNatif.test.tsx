import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useDialogueNatif } from '@/ui/hooks/useDialogueNatif'

/**
 * `useDialogueNatif` : la discipline du `<dialog>` natif, partagée par la
 * `Modale` des Statistiques et la feuille de règles (lot `regles-du-jeu`,
 * Révision 1). Ces tests visent le hook seul, sur un `<dialog>` minimal.
 */
const Harnais = ({
  ouvert,
  onFermer,
  avecRetour = false,
}: {
  readonly ouvert: boolean
  readonly onFermer: () => void
  readonly avecRetour?: boolean
}) => {
  const livre = useRef<HTMLButtonElement>(null)
  const { boite, croix, surAnnulation, surFermeture, surAppui, surClic } = useDialogueNatif(
    ouvert,
    onFermer,
    avecRetour ? livre : undefined,
  )
  return (
    <>
      <button type="button">Origine</button>
      <button ref={livre} type="button">
        Livre
      </button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: harnais de test, comme la `Modale` */}
      <dialog
        ref={boite}
        aria-label="Boîte"
        onCancel={surAnnulation}
        onClose={surFermeture}
        onPointerDown={surAppui}
        onClick={surClic}
      >
        {ouvert && (
          <>
            <button ref={croix} type="button" onClick={onFermer}>
              Fermer
            </button>
            <p>Contenu</p>
          </>
        )}
      </dialog>
    </>
  )
}

const dialogue = () => document.querySelector('dialog') as HTMLDialogElement

describe('useDialogueNatif — la discipline du <dialog> natif', () => {
  it('monté fermé, il ne prend ni ne déplace le focus', () => {
    render(<Harnais ouvert={false} onFermer={vi.fn()} avecRetour />)
    expect(dialogue().open).toBe(false)
    // Le livre (`retour`) ne prend pas le focus au montage : aucune ouverture n'a eu lieu.
    expect(screen.getByRole('button', { name: 'Livre' })).not.toHaveFocus()
    expect(document.body).toHaveFocus()
  })

  it('ouvert : `showModal()` et focus sur ✕', () => {
    render(<Harnais ouvert onFermer={vi.fn()} />)
    expect(dialogue().open).toBe(true)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
  })

  it('avec `retour`, le focus y revient même si rien n’avait le focus (Safari)', () => {
    const { rerender } = render(<Harnais ouvert={false} onFermer={vi.fn()} avecRetour />)
    expect(document.body).toHaveFocus()
    rerender(<Harnais ouvert onFermer={vi.fn()} avecRetour />)
    rerender(<Harnais ouvert={false} onFermer={vi.fn()} avecRetour />)
    expect(dialogue().open).toBe(false)
    expect(screen.getByRole('button', { name: 'Livre' })).toHaveFocus()
  })

  it('avec `retour`, il l’emporte sur l’élément d’origine', () => {
    const { rerender } = render(<Harnais ouvert={false} onFermer={vi.fn()} avecRetour />)
    screen.getByRole('button', { name: 'Origine' }).focus()
    rerender(<Harnais ouvert onFermer={vi.fn()} avecRetour />)
    rerender(<Harnais ouvert={false} onFermer={vi.fn()} avecRetour />)
    expect(screen.getByRole('button', { name: 'Livre' })).toHaveFocus()
  })

  it('sans `retour`, le focus revient à l’élément d’origine', () => {
    const { rerender } = render(<Harnais ouvert={false} onFermer={vi.fn()} />)
    const origine = screen.getByRole('button', { name: 'Origine' })
    origine.focus()
    rerender(<Harnais ouvert onFermer={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    rerender(<Harnais ouvert={false} onFermer={vi.fn()} />)
    expect(origine).toHaveFocus()
  })

  it('`cancel` (Échap) : annulé, puis relayé une fois', () => {
    const onFermer = vi.fn()
    render(<Harnais ouvert onFermer={onFermer} />)
    const annulation = new Event('cancel', { cancelable: true })
    fireEvent(dialogue(), annulation)
    expect(annulation.defaultPrevented).toBe(true)
    expect(onFermer).toHaveBeenCalledTimes(1)
    expect(dialogue().open).toBe(true)
  })

  it('`close` relayé seulement tant que c’est ouvert', () => {
    const onFermer = vi.fn()
    const { rerender } = render(<Harnais ouvert onFermer={onFermer} />)
    fireEvent(dialogue(), new Event('close'))
    expect(onFermer).toHaveBeenCalledTimes(1)

    rerender(<Harnais ouvert={false} onFermer={onFermer} />)
    expect(dialogue().open).toBe(false)
    fireEvent(dialogue(), new Event('close'))
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('un appui à côté ferme ; dans la boîte, non', () => {
    const onFermer = vi.fn()
    render(<Harnais ouvert onFermer={onFermer} />)
    const d = dialogue()
    d.getBoundingClientRect = () => new DOMRect(0, 210, 390, 634)

    fireEvent.pointerDown(screen.getByText('Contenu'), { clientX: 50, clientY: 300 })
    fireEvent.click(screen.getByText('Contenu'), { clientX: 50, clientY: 300 })
    fireEvent.pointerDown(d, { clientX: 1, clientY: 211 })
    fireEvent.click(d, { clientX: 1, clientY: 211 })
    expect(onFermer).not.toHaveBeenCalled()

    fireEvent.pointerDown(d, { clientX: 50, clientY: 100 })
    fireEvent.click(d, { clientX: 50, clientY: 100 })
    expect(onFermer).toHaveBeenCalledTimes(1)
  })

  it('P3-2 : un glisser parti du voile et lâché dans la boîte ne ferme pas', () => {
    const onFermer = vi.fn()
    render(<Harnais ouvert onFermer={onFermer} />)
    const d = dialogue()
    d.getBoundingClientRect = () => new DOMRect(0, 210, 390, 634)

    // Lâché sur la bordure : la cible est le <dialog>, mais le point est dans sa boîte.
    fireEvent.pointerDown(d, { clientX: 50, clientY: 100 })
    fireEvent.click(d, { clientX: 50, clientY: 300 })
    // Lâché sur le contenu.
    fireEvent.pointerDown(d, { clientX: 50, clientY: 100 })
    fireEvent.click(screen.getByText('Contenu'), { clientX: 50, clientY: 300 })
    expect(onFermer).not.toHaveBeenCalled()
  })

  it('sous StrictMode : ouvert au montage, il le reste (aucun nettoyage qui ferme)', () => {
    const onFermer = vi.fn()
    render(
      <StrictMode>
        <Harnais ouvert onFermer={onFermer} avecRetour />
      </StrictMode>,
    )
    expect(dialogue().open).toBe(true)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    expect(onFermer).not.toHaveBeenCalled()
  })
})
