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
  it('rendert Link, Bild und übersetztes Department', () => {
    renderCard(basePerson, { index: 2, animate: true })

    const link = document.querySelector('a[href="/person/77"]')
    expect(link).toBeInTheDocument()
    expect(link.className).toContain('animate-fade-in')

    expect(screen.getByAltText('Max Mustermann')).toHaveAttribute('src', 'https://img.test/w342/max.jpg')
    expect(screen.getAllByText('Schauspiel').length).toBeGreaterThan(0)
  })

  it('zeigt maximal drei "Bekannt für"-Einträge', () => {
    renderCard()

    expect(screen.getByText('Film Eins')).toBeInTheDocument()
    expect(screen.getByText('Serie Zwei')).toBeInTheDocument()
    expect(screen.getByText('Film Drei')).toBeInTheDocument()
    expect(screen.queryByText('Film Vier')).not.toBeInTheDocument()
  })

  it('zeigt Fallback bei fehlendem Profilbild und fehlenden Known-For-Daten', () => {
    renderCard({
      id: 5,
      name: 'No Image',
      profile_path: null,
      known_for_department: 'Directing',
      known_for: [],
    })

    expect(screen.queryByAltText('No Image')).not.toBeInTheDocument()
    expect(screen.getAllByText('Regie').length).toBeGreaterThan(0)
    expect(screen.queryByText('Bekannt für')).not.toBeInTheDocument()
  })
})
