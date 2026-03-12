import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider } from './Toast'
import { useToast } from './useToast'

function TestTrigger({ message, type }) {
  const show = useToast()
  return <button onClick={() => show(message, type)}>Trigger</button>
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rendert Kinder', () => {
    render(
      <ToastProvider>
        <span>Inhalt</span>
      </ToastProvider>
    )
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('zeigt Toast-Nachricht nach Trigger', () => {
    render(
      <ToastProvider>
        <TestTrigger message="Test Toast" type="default" />
      </ToastProvider>
    )
    act(() => {
      screen.getByText('Trigger').click()
    })
    // Toast is in DOM right after click (before animation timers)
    expect(screen.getByText('Test Toast')).toBeInTheDocument()
  })

  it('zeigt Error-Icon bei type=error', () => {
    render(
      <ToastProvider>
        <TestTrigger message="Fehler!" type="error" />
      </ToastProvider>
    )
    act(() => {
      screen.getByText('Trigger').click()
    })
    expect(screen.getByText('Fehler!')).toBeInTheDocument()
  })

  it('zeigt Success-Icon bei type=success', () => {
    render(
      <ToastProvider>
        <TestTrigger message="Gespeichert" type="success" />
      </ToastProvider>
    )
    act(() => {
      screen.getByText('Trigger').click()
    })
    const alert = screen.getByRole('alert')
    expect(alert.querySelector('svg.text-emerald-400')).not.toBeNull()
  })

  it('zeigt Warning-Icon bei type=warning', () => {
    render(
      <ToastProvider>
        <TestTrigger message="Hinweis" type="warning" />
      </ToastProvider>
    )
    act(() => {
      screen.getByText('Trigger').click()
    })
    const alert = screen.getByRole('alert')
    expect(alert.querySelector('svg.text-amber-300')).not.toBeNull()
  })
})

