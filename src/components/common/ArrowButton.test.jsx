import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ArrowButton from './ArrowButton'

describe('ArrowButton', () => {
  it('rendert einen Links-Button mit korrektem aria-label', () => {
    render(<ArrowButton direction="left" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Zurück scrollen' })).toBeInTheDocument()
  })

  it('rendert einen Rechts-Button mit korrektem aria-label', () => {
    render(<ArrowButton direction="right" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Weiter scrollen' })).toBeInTheDocument()
  })

  it('ruft onClick beim Klick auf', () => {
    const onClick = vi.fn()
    render(<ArrowButton direction="left" onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('verwendet die Standard-groupHoverClass wenn keine angegeben', () => {
    const { container } = render(<ArrowButton direction="left" onClick={() => {}} />)
    expect(container.querySelector('button').className).toContain('group-hover/row')
  })

  it('verwendet eine benutzerdefinierte groupHoverClass', () => {
    const { container } = render(
      <ArrowButton direction="right" onClick={() => {}} groupHoverClass="group-hover/cast" />
    )
    expect(container.querySelector('button').className).toContain('group-hover/cast')
  })
})
