import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SegmentedControl from './SegmentedControl'

describe('SegmentedControl', () => {
  const options = [
    { value: 'movie', label: 'Filme' },
    { value: 'tv', label: 'Serien' },
  ]

  it('rendert alle Optionen und markiert die aktive Option', () => {
    render(<SegmentedControl options={options} value="movie" onChange={() => {}} />)

    expect(screen.getByText('Filme')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'false')
  })

  it('ruft onChange mit dem Wert der geklickten Option auf', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="movie" onChange={onChange} />)

    fireEvent.click(screen.getByText('Serien'))

    expect(onChange).toHaveBeenCalledWith('tv')
  })

  it('rendert nichts ohne Optionen', () => {
    const { container } = render(<SegmentedControl options={[]} value="" onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
