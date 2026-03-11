import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from './Footer'

describe('Footer', () => {
  it('rendert StreamScout-Logo', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByText('StreamScout')).toBeInTheDocument()
  })

  it('rendert Navigations-Links', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByText('Suche')).toBeInTheDocument()
    expect(screen.getByText('Entdecken')).toBeInTheDocument()
    expect(screen.getByText('Zufall')).toBeInTheDocument()
    expect(screen.getByText('Merkliste')).toBeInTheDocument()
  })

  it('rendert TMDB und JustWatch Attribution', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByText('TMDB')).toHaveAttribute('target', '_blank')
    expect(screen.getByText('JustWatch')).toHaveAttribute('target', '_blank')
  })

  it('hat rel=noopener noreferrer auf externen Links', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByText('TMDB')).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('JustWatch')).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
