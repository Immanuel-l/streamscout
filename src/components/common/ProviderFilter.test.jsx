import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProviderFilter from './ProviderFilter'

const mockProviders = [
  { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' },
  { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/disney.jpg' },
]

describe('ProviderFilter', () => {
  it('rendert nichts ohne Provider', () => {
    const { container } = render(<ProviderFilter providers={[]} selected={[]} onToggle={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert Provider-Buttons mit Labels', () => {
    render(<ProviderFilter providers={mockProviders} selected={[]} onToggle={() => {}} />)
    expect(screen.getByLabelText('Netflix aktivieren')).toBeInTheDocument()
    expect(screen.getByLabelText('Disney Plus aktivieren')).toBeInTheDocument()
  })

  it('markiert selektierte Provider mit aria-pressed', () => {
    render(<ProviderFilter providers={mockProviders} selected={[8]} onToggle={() => {}} />)
    expect(screen.getByLabelText('Netflix deaktivieren')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Disney Plus aktivieren')).toHaveAttribute('aria-pressed', 'false')
  })

  it('ruft onToggle mit provider_id beim Klick', () => {
    const onToggle = vi.fn()
    render(<ProviderFilter providers={mockProviders} selected={[]} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Netflix aktivieren'))
    expect(onToggle).toHaveBeenCalledWith(8)
  })

  it('zeigt benutzerdefiniertes Label', () => {
    render(<ProviderFilter providers={mockProviders} selected={[]} onToggle={() => {}} label="Filter" />)
    expect(screen.getByText('Filter')).toBeInTheDocument()
  })
})
