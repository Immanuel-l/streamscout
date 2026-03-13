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

  it('rendert Provider und toggelt deren Auswahl', () => {
    const onToggle = vi.fn()
    render(<ProviderFilter providers={mockProviders} selected={[8]} onToggle={onToggle} />)

    expect(screen.getByLabelText('Netflix deaktivieren')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Disney Plus aktivieren')).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByLabelText('Disney Plus aktivieren'))
    expect(onToggle).toHaveBeenCalledWith(337)
  })
})
