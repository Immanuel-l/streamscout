import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PersonCard from './PersonCard'

vi.mock('../../api/tmdb', () => ({
  IMAGE_BASE: 'https://img.test',
}))

const basePerson = {
  id: 77,
  name: 'Max Mustermann',
  profile_path: '/max.jpg',
  known_for_department: 'Acting',
  known_for: [
    { id: 1, title: 'Film Eins' },
    { id: 2, name: 'Serie Zwei' },
    { id: 3, title: 'Film Drei' },
    { id: 4, title: 'Film Vier' },
  ],
}

function renderCard(person = basePerson, props = {}) {
  return render(
    <MemoryRouter>
      <PersonCard person={person} {...props} />
    </MemoryRouter>
  )
}

describe('PersonCard', () => {
  it('rendert Link, Profilbild und uebersetztes Department', () => {
    renderCard(basePerson, { index: 2, animate: true })

    const link = document.querySelector('a[href="/person/77"]')
    expect(link).toBeInTheDocument()
    expect(link.className).toContain('animate-fade-in')
    expect(link.style.animationDelay).toBe('100ms')

    const image = screen.getByAltText('Max Mustermann')
    expect(image).toHaveAttribute('src', 'https://img.test/w342/max.jpg')

    expect(screen.getAllByText('Schauspiel').length).toBeGreaterThan(0)
  })

  it('zeigt maximal drei "Bekannt fuer"-Eintraege', () => {
    renderCard()

    expect(screen.getByText('Bekannt für')).toBeInTheDocument()
    expect(screen.getByText('Film Eins')).toBeInTheDocument()
    expect(screen.getByText('Serie Zwei')).toBeInTheDocument()
    expect(screen.getByText('Film Drei')).toBeInTheDocument()
    expect(screen.queryByText('Film Vier')).not.toBeInTheDocument()
  })

  it('zeigt Fallback ohne Profilbild und ohne Known-For-Bereich', () => {
    renderCard({
      id: 5,
      name: 'No Image',
      profile_path: null,
      known_for_department: 'Directing',
      known_for: [],
    })

    expect(screen.queryByAltText('No Image')).not.toBeInTheDocument()
    expect(screen.queryByText('Bekannt für')).not.toBeInTheDocument()
    expect(screen.getAllByText('Regie').length).toBeGreaterThan(0)
  })

  it('nutzt unbekanntes Department unveraendert und deaktiviert Animation', () => {
    renderCard(
      {
        id: 11,
        name: 'Tech Person',
        profile_path: '/tech.jpg',
        known_for_department: 'Visual Effects',
        known_for: [{ id: 1, title: 'VFX Movie' }],
      },
      { animate: false }
    )

    const link = document.querySelector('a[href="/person/11"]')
    expect(link).toBeInTheDocument()
    expect(link.className).not.toContain('animate-fade-in')
    expect(link.style.animationDelay).toBe('')

    expect(screen.getAllByText('Visual Effects').length).toBeGreaterThan(0)
  })

  it('verarbeitet fehlende known_for Daten und leeres Department robust', () => {
    renderCard(
      {
        id: 12,
        name: 'Unknown Person',
        profile_path: '/unknown.jpg',
        known_for_department: '',
      },
      { animate: true }
    )

    expect(screen.getByAltText('Unknown Person')).toHaveAttribute('src', 'https://img.test/w342/unknown.jpg')
    expect(screen.queryByText('Bekannt für')).not.toBeInTheDocument()
    expect(screen.getAllByText('Unknown Person').length).toBeGreaterThan(0)
  })
})

