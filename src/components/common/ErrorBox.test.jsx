import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBox from './ErrorBox'

describe('ErrorBox', () => {
  it('zeigt die Standard-Fehlermeldung', () => {
    render(<ErrorBox />)
    expect(screen.getByText(/Etwas ist schiefgelaufen/)).toBeInTheDocument()
  })

  it('zeigt eine benutzerdefinierte Fehlermeldung', () => {
    render(<ErrorBox message="Netzwerkfehler aufgetreten" />)
    expect(screen.getByText('Netzwerkfehler aufgetreten')).toBeInTheDocument()
  })

  it('zeigt keinen Retry-Button ohne onRetry Prop', () => {
    render(<ErrorBox />)
    expect(screen.queryByText('Erneut versuchen')).not.toBeInTheDocument()
  })

  it('zeigt einen Retry-Button mit onRetry Prop', () => {
    render(<ErrorBox onRetry={() => {}} />)
    expect(screen.getByText('Erneut versuchen')).toBeInTheDocument()
  })

  it('ruft onRetry beim Klick auf', () => {
    const onRetry = vi.fn()
    render(<ErrorBox onRetry={onRetry} />)

    fireEvent.click(screen.getByText('Erneut versuchen'))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
