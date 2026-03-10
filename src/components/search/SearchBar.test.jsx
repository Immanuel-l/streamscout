import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SearchBar from './SearchBar'

function renderSearchBar(props = {}) {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    suggestions: [],
    history: [],
    ...props,
  }
  return render(
    <MemoryRouter>
      <SearchBar {...defaultProps} />
    </MemoryRouter>
  )
}

describe('SearchBar', () => {
  it('rendert ein Suchfeld mit Placeholder', () => {
    renderSearchBar()
    expect(screen.getByPlaceholderText('Film, Serie oder Person suchen...')).toBeInTheDocument()
  })

  it('zeigt den aktuellen Wert an', () => {
    renderSearchBar({ value: 'Matrix' })
    expect(screen.getByDisplayValue('Matrix')).toBeInTheDocument()
  })

  it('ruft onChange bei Eingabe auf', () => {
    const onChange = vi.fn()
    renderSearchBar({ onChange })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test' } })
    expect(onChange).toHaveBeenCalledWith('Test')
  })

  it('leert das Feld und öffnet History beim Clear-Button', () => {
    const onChange = vi.fn()
    renderSearchBar({ value: 'test', onChange, history: ['Matrix'] })

    fireEvent.click(screen.getByLabelText('Suche leeren'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('zeigt den Leeren-Button wenn ein Wert vorhanden ist', () => {
    renderSearchBar({ value: 'etwas' })
    expect(screen.getByLabelText('Suche leeren')).toBeInTheDocument()
  })

  it('zeigt keinen Leeren-Button wenn das Feld leer ist', () => {
    renderSearchBar({ value: '' })
    expect(screen.queryByLabelText('Suche leeren')).not.toBeInTheDocument()
  })

  it('leert das Suchfeld beim Klick auf den Leeren-Button', () => {
    const onChange = vi.fn()
    renderSearchBar({ value: 'test', onChange })

    fireEvent.click(screen.getByLabelText('Suche leeren'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hat role="combobox" mit aria-Attributen', () => {
    renderSearchBar()
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded')
  })

  it('zeigt Suchverlauf wenn Feld leer und fokussiert', () => {
    renderSearchBar({
      value: '',
      history: ['Matrix', 'Inception'],
    })

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByText('Zuletzt gesucht')).toBeInTheDocument()
    expect(screen.getByText('Matrix')).toBeInTheDocument()
    expect(screen.getByText('Inception')).toBeInTheDocument()
  })

  it('ruft onHistoryClear beim Löschen des Verlaufs auf', () => {
    const onHistoryClear = vi.fn()
    renderSearchBar({
      value: '',
      history: ['Test'],
      onHistoryClear,
    })

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Löschen'))

    expect(onHistoryClear).toHaveBeenCalledOnce()
  })

  it('ruft onHistoryRemove beim Entfernen eines Verlaufseintrags auf', () => {
    const onHistoryRemove = vi.fn()
    renderSearchBar({
      value: '',
      history: ['Test'],
      onHistoryRemove,
    })

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.click(screen.getByLabelText('"Test" aus Verlauf entfernen'))

    expect(onHistoryRemove).toHaveBeenCalledWith('Test')
  })
})
