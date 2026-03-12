import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Select from './Select'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Select', () => {
  it('zeigt den Placeholder wenn kein Wert ausgewählt', () => {
    render(<Select value="" onChange={() => {}} options={options} placeholder="Bitte wählen" />)
    expect(screen.getByText('Bitte wählen')).toBeInTheDocument()
  })

  it('zeigt das ausgewählte Label', () => {
    render(<Select value="b" onChange={() => {}} options={options} />)
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('öffnet das Dropdown beim Klick', () => {
    render(<Select value="" onChange={() => {}} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('schließt bei Klick außerhalb', () => {
    render(<Select value="" onChange={() => {}} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ruft onChange beim Auswählen einer Option', () => {
    const onChange = vi.fn()
    render(<Select value="" onChange={onChange} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Option C'))

    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('schließt das Dropdown nach Auswahl', () => {
    render(<Select value="" onChange={() => {}} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Option A'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('schließt das Dropdown bei Escape', () => {
    render(<Select value="" onChange={() => {}} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('öffnet mit ArrowUp/ArrowDown und wrappt die Navigation', () => {
    const onChange = vi.fn()
    render(<Select value="" onChange={onChange} options={options} />)

    const combobox = screen.getByRole('combobox')

    fireEvent.keyDown(combobox, { key: 'ArrowUp' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(combobox, { key: 'ArrowUp' })
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('c')

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('öffnet mit Leertaste wenn geschlossen', () => {
    render(<Select value="" onChange={() => {}} options={options} />)

    const combobox = screen.getByRole('combobox')
    fireEvent.keyDown(combobox, { key: ' ' })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('nutzt Home/End zur Zielauswahl', () => {
    const onChange = vi.fn()
    render(<Select value="b" onChange={onChange} options={options} />)

    const combobox = screen.getByRole('combobox')
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    fireEvent.keyDown(combobox, { key: 'End' })
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('c')

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'Home' })
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('aktualisiert Highlight per MouseEnter', () => {
    const onChange = vi.fn()
    render(<Select value="" onChange={onChange} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.mouseEnter(screen.getByRole('option', { name: 'Option C' }))
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('nutzt ariaLabel statt Placeholder wenn gesetzt', () => {
    render(<Select value="" onChange={() => {}} options={options} placeholder="Bitte wählen" ariaLabel="Genre Filter" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Genre Filter')
  })

  it('setzt aria-expanded korrekt', () => {
    render(<Select value="" onChange={() => {}} options={options} />)
    const combobox = screen.getByRole('combobox')

    expect(combobox).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(combobox)
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
  })
})
