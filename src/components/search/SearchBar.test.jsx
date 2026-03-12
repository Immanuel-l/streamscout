import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import SearchBar from './SearchBar'

const suggestionsFixture = [
  { id: 1, media_type: 'movie', title: 'Matrix', release_date: '1999-03-31', poster_path: null },
  { id: 2, media_type: 'tv', name: 'Dark', first_air_date: '2017-12-01', poster_path: null },
  { id: 3, media_type: 'person', name: 'Keanu Reeves', profile_path: null },
]

function LocationDisplay() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderSearchBar(props = {}) {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    suggestions: [],
    history: [],
    ...props,
  }
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <SearchBar {...defaultProps} />
              <LocationDisplay />
            </>
          )}
        />
      </Routes>
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

  it('leert das Feld und offnet History beim Clear-Button', () => {
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

  it('navigiert bei Enter durch Suggestions-Keyboard-Navigation', () => {
    renderSearchBar({ suggestions: suggestionsFixture })
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    let options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('location')).toHaveTextContent('/movie/1')
  })

  it('schliesst Suggestion-Dropdown per Escape', () => {
    renderSearchBar({ suggestions: suggestionsFixture })
    const input = screen.getByRole('combobox')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it.each([
    ['Movie', suggestionsFixture[0], '/movie/1'],
    ['TV', suggestionsFixture[1], '/tv/2'],
    ['Person', suggestionsFixture[2], '/person/3'],
  ])('navigiert per Klick zur %s-Detailseite', (_label, suggestion, expectedPath) => {
    renderSearchBar({ suggestions: [suggestion] })
    fireEvent.click(screen.getByText(suggestion.title || suggestion.name))
    expect(screen.getByTestId('location')).toHaveTextContent(expectedPath)
  })

  it('navigiert Suchverlauf per Keyboard und schliesst mit Escape', () => {
    const onHistorySelect = vi.fn()
    renderSearchBar({
      value: '',
      history: ['Matrix', 'Inception'],
      onHistorySelect,
    })

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onHistorySelect).toHaveBeenCalledWith('Matrix')

    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByText('Zuletzt gesucht')).not.toBeInTheDocument()
  })

  it('schliesst offene Dropdowns bei Klick ausserhalb', () => {
    renderSearchBar({
      value: '',
      history: ['Matrix'],
    })

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByText('Zuletzt gesucht')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Zuletzt gesucht')).not.toBeInTheDocument()
  })
})
