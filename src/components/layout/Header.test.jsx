import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('rendert Logo und Desktop-Navigation', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    expect(screen.getByText('StreamScout')).toBeInTheDocument()
    // Links appear twice (desktop + mobile nav)
    expect(screen.getAllByText('Home')).toHaveLength(2)
    expect(screen.getAllByText('Suche')).toHaveLength(2)
    expect(screen.getAllByText('Entdecken')).toHaveLength(2)
  })

  it('hat Skip-to-Content Link', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    expect(screen.getByText('Zum Inhalt springen')).toHaveAttribute('href', '#main-content')
  })

  it('zeigt Mobile-Menü-Button mit aria-label', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    const btn = screen.getByLabelText('Menü öffnen')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggled Mobile-Menü beim Klick', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    const btn = screen.getByLabelText('Menü öffnen')
    fireEvent.click(btn)
    expect(screen.getByLabelText('Menü schließen')).toHaveAttribute('aria-expanded', 'true')
  })

  it('schließt Mobile-Menü bei Escape', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText('Menü öffnen'))
    expect(screen.getByLabelText('Menü schließen')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByLabelText('Menü öffnen')).toBeInTheDocument()
  })

  it('zeigt Theme-Toggle Button', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    // Desktop + Mobile = 2 toggle buttons
    const toggles = screen.getAllByLabelText('Helles Design aktivieren')
    expect(toggles.length).toBeGreaterThan(0)
  })
})
