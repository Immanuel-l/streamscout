import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBox from './ErrorBox'

describe('ErrorBox', () => {
  it('zeigt Standardtext ohne Retry-Button', () => {
    render(<ErrorBox />)

    expect(screen.getByText(/Etwas ist schiefgelaufen/)).toBeInTheDocument()
    expect(screen.queryByText('Erneut versuchen')).not.toBeInTheDocument()
  })

  it('zeigt benutzerdefinierte Nachricht und ruft onRetry auf', () => {
    const onRetry = vi.fn()

    render(<ErrorBox message="Netzwerkfehler aufgetreten" onRetry={onRetry} />)

    expect(screen.getByText('Netzwerkfehler aufgetreten')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Erneut versuchen'))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
