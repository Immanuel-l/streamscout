import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

let shouldThrow = true

function ConditionalChild() {
  if (shouldThrow) throw new Error('Test-Fehler')
  return <p>Alles gut</p>
}

function GoodChild() {
  return <p>Alles gut</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    window.location.hash = ''
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rendert Kinder wenn kein Fehler auftritt', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Alles gut')).toBeInTheDocument()
  })

  it('zeigt Fehlermeldung wenn ein Kind einen Fehler wirft', () => {
    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument()
    expect(screen.getByText(/Ein unerwarteter Fehler ist aufgetreten/)).toBeInTheDocument()
  })

  it('zeigt Erneut-Versuchen und Startseite-Buttons', () => {
    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Erneut versuchen')).toBeInTheDocument()
    expect(screen.getByText('Zur Startseite')).toBeInTheDocument()
  })

  it('navigiert per Hash zur Startseite beim Klick auf Startseite', () => {
    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    )

    shouldThrow = false
    fireEvent.click(screen.getByText('Zur Startseite'))

    expect(window.location.hash).toBe('#/')
  })

  it('setzt den Fehlerstatus beim Klick auf Erneut versuchen zurück', () => {
    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument()

    // Stop throwing so re-render succeeds
    shouldThrow = false
    fireEvent.click(screen.getByText('Erneut versuchen'))

    expect(screen.getByText('Alles gut')).toBeInTheDocument()
  })
})
