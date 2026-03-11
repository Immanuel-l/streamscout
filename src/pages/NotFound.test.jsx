import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('zeigt 404-Text und Überschrift', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Seite nicht gefunden')).toBeInTheDocument()
  })

  it('zeigt Links zur Startseite und Entdecken', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByText('Zur Startseite')).toHaveAttribute('href', '/')
    expect(screen.getByText('Entdecken')).toHaveAttribute('href', '/discover')
  })
})
