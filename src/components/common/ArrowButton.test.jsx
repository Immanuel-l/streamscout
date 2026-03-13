import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ArrowButton from './ArrowButton'

describe('ArrowButton', () => {
  it('rendert je nach Richtung das passende aria-label', () => {
    const { rerender } = render(<ArrowButton direction="left" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Zurück scrollen' })).toBeInTheDocument()

    rerender(<ArrowButton direction="right" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Weiter scrollen' })).toBeInTheDocument()
  })

  it('ruft onClick auf und nutzt optional eine benutzerdefinierte groupHoverClass', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ArrowButton direction="right" onClick={onClick} groupHoverClass="group-hover/cast" />
    )

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
    expect(container.querySelector('button').className).toContain('group-hover/cast')
  })
})
