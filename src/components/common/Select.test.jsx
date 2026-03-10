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

  it('navigiert mit Pfeiltasten und wählt mit Enter', () => {
    const onChange = vi.fn()
    render(<Select value="" onChange={onChange} options={options} />)

    const combobox = screen.getByRole('combobox')

    // Open with ArrowDown
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Navigate down
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    // Select with Enter
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('setzt aria-expanded korrekt', () => {
    render(<Select value="" onChange={() => {}} options={options} />)
    const combobox = screen.getByRole('combobox')

    expect(combobox).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(combobox)
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
  })
})
