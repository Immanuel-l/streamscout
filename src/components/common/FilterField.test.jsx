import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FilterField from './FilterField'

describe('FilterField', () => {
  it('rendert Label und Inhalt', () => {
    render(
      <FilterField label="Genre">
        <div>Inhalt</div>
      </FilterField>
    )

    expect(screen.getByText('Genre')).toBeInTheDocument()
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('rendert optionale Beschreibung', () => {
    render(
      <FilterField label="Auswahlfokus" description="Steuert den Treffer-Pool.">
        <div>Optionen</div>
      </FilterField>
    )

    expect(screen.getByText('Steuert den Treffer-Pool.')).toBeInTheDocument()
  })
})
