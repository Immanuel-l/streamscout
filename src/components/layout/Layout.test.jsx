import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'

function DiscoverWithInputs() {
  return (
    <div>
      <p>Discover</p>
      <input aria-label="Discover Input" type="text" />
      <textarea aria-label="Discover Textarea" />
      <select aria-label="Discover Select">
        <option value="1">One</option>
      </select>
      <div contentEditable data-testid="discover-editable" suppressContentEditableWarning>
        edit
      </div>
    </div>
  )
}

function SearchPage() {
  return (
    <div>
      <p>Search</p>
      <input aria-label="Search Input" type="text" />
    </div>
  )
}

function renderLayout(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<p>Home Seite</p>} />
          <Route path="discover" element={<DiscoverWithInputs />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('rendert Header, Main-Content und Footer', () => {
    renderLayout()
    expect(screen.getAllByText('StreamScout').length).toBeGreaterThan(0)
    expect(screen.getByText('Home Seite')).toBeInTheDocument()
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('scrollt bei Route-Wechsel nach oben', () => {
    window.scrollTo = vi.fn()
    renderLayout(['/discover'])
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('navigiert per "/"-Shortcut von anderen Seiten zur Suche', () => {
    renderLayout(['/discover'])
    expect(screen.getByText('Discover')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: '/' })
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('fokussiert auf der Suchseite das Suchfeld per "/"-Shortcut', () => {
    renderLayout(['/search'])
    const searchInput = screen.getByLabelText('Search Input')
    const focusSpy = vi.spyOn(searchInput, 'focus')

    fireEvent.keyDown(document, { key: '/' })

    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(focusSpy).toHaveBeenCalled()
  })

  it('ignoriert den "/"-Shortcut in Input, Textarea, Select und contentEditable', () => {
    renderLayout(['/discover'])
    const input = screen.getByLabelText('Discover Input')
    const textarea = screen.getByLabelText('Discover Textarea')
    const select = screen.getByLabelText('Discover Select')
    const editable = screen.getByTestId('discover-editable')

    Object.defineProperty(editable, 'isContentEditable', {
      configurable: true,
      value: true,
    })

    fireEvent.keyDown(input, { key: '/' })
    expect(screen.getByText('Discover')).toBeInTheDocument()

    fireEvent.keyDown(textarea, { key: '/' })
    expect(screen.getByText('Discover')).toBeInTheDocument()

    fireEvent.keyDown(select, { key: '/' })
    expect(screen.getByText('Discover')).toBeInTheDocument()

    fireEvent.keyDown(editable, { key: '/' })
    expect(screen.getByText('Discover')).toBeInTheDocument()
  })
})
