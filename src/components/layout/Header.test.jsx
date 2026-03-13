import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('rendert Logo, zentrale Navigation und Skip-Link', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)

    expect(screen.getByText('StreamScout')).toBeInTheDocument()
    expect(screen.getAllByText('Suche').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Entdecken').length).toBeGreaterThan(0)
    expect(screen.getByText('Zum Inhalt springen')).toHaveAttribute('href', '#main-content')
  })

  it('öffnet und schließt das Mobile-Menü inkl. Escape', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)

    const openButton = screen.getByLabelText('Menü öffnen')
    fireEvent.click(openButton)

    expect(screen.getByLabelText('Menü schließen')).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByLabelText('Menü öffnen')).toBeInTheDocument()
  })

  it('zeigt Theme-Toggle-Buttons', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    expect(screen.getAllByLabelText('Helles Design aktivieren').length).toBeGreaterThan(0)
  })
})
