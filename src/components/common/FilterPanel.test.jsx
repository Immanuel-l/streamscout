import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FilterPanel from './FilterPanel'

describe('FilterPanel', () => {
  it('zeigt Quick-Content und Status ohne aktive Filter', () => {
    render(
      <FilterPanel
        title="Testfilter"
        quickContent={<div>Quick Inhalt</div>}
      />
    )

    expect(screen.getByText('Testfilter')).toBeInTheDocument()
    expect(screen.getByText('Keine aktiven Filter')).toBeInTheDocument()
    expect(screen.getByText('Quick Inhalt')).toBeInTheDocument()
  })

  it('oeffnet und schliesst den erweiterten Bereich', () => {
    render(
      <FilterPanel
        quickContent={<div>Quick</div>}
      >
        <div>Advanced Inhalt</div>
      </FilterPanel>
    )

    const toggleButton = screen.getByRole('button', { name: 'Weitere Filter anzeigen' })
    const panelId = toggleButton.getAttribute('aria-controls')
    const panelElement = document.getElementById(panelId)

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(panelElement?.className).toContain('hidden')

    fireEvent.click(toggleButton)

    expect(screen.getByRole('button', { name: 'Weitere Filter ausblenden' })).toHaveAttribute('aria-expanded', 'true')
    expect(panelElement?.className).toContain('block')
    expect(screen.getByText('Advanced Inhalt')).toBeInTheDocument()
  })

  it('zeigt Reset-Button nur bei aktiven Filtern und ruft Handler auf', () => {
    const onReset = vi.fn()

    render(
      <FilterPanel
        activeCount={2}
        onReset={onReset}
        quickContent={<div>Quick</div>}
      />
    )

    const resetButton = screen.getByRole('button', { name: 'Filter zurücksetzen' })
    fireEvent.click(resetButton)

    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
