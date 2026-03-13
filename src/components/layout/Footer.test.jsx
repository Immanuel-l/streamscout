import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from './Footer'

describe('Footer', () => {
  it('rendert Branding und zentrale Navigations-Links', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByText('StreamScout')).toBeInTheDocument()
    expect(screen.getByText('Suche')).toBeInTheDocument()
    expect(screen.getByText('Entdecken')).toBeInTheDocument()
    expect(screen.getByText('Merkliste')).toBeInTheDocument()
  })

  it('setzt externe Links sicher mit target und rel', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByText('TMDB')).toHaveAttribute('target', '_blank')
    expect(screen.getByText('TMDB')).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('JustWatch')).toHaveAttribute('target', '_blank')
    expect(screen.getByText('JustWatch')).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
