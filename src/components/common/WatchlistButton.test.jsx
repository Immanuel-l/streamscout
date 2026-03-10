import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WatchlistButton from './WatchlistButton'
import { ToastContext } from './useToast'

// Mock useWatchlist
vi.mock('../../hooks/useWatchlist', () => {
  const toggle = vi.fn()
  const isInWatchlist = vi.fn(() => false)
  return {
    useWatchlist: () => ({ toggle, isInWatchlist }),
    __toggle: toggle,
    __isInWatchlist: isInWatchlist,
  }
})

import { __toggle as toggle, __isInWatchlist as isInWatchlist } from '../../hooks/useWatchlist'

const movie = { id: 1, media_type: 'movie', title: 'Testfilm' }

function renderWithToast(ui) {
  const toast = vi.fn()
  return {
    toast,
    ...render(
      <ToastContext.Provider value={toast}>
        {ui}
      </ToastContext.Provider>
    ),
  }
}

describe('WatchlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isInWatchlist.mockReturnValue(false)
  })

  it('rendert einen Button', () => {
    renderWithToast(<WatchlistButton media={movie} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('zeigt "Auf Merkliste setzen" wenn nicht in Watchlist', () => {
    renderWithToast(<WatchlistButton media={movie} />)
    expect(screen.getByTitle('Auf Merkliste setzen')).toBeInTheDocument()
  })

  it('zeigt "Von Merkliste entfernen" wenn in Watchlist', () => {
    isInWatchlist.mockReturnValue(true)
    renderWithToast(<WatchlistButton media={movie} />)
    expect(screen.getByTitle('Von Merkliste entfernen')).toBeInTheDocument()
  })

  it('ruft toggle beim Klick auf', () => {
    renderWithToast(<WatchlistButton media={movie} />)

    fireEvent.click(screen.getByRole('button'))
    expect(toggle).toHaveBeenCalledWith(movie)
  })

  it('zeigt Toast-Nachricht beim Hinzufügen', () => {
    const { toast } = renderWithToast(<WatchlistButton media={movie} />)

    fireEvent.click(screen.getByRole('button'))
    expect(toast).toHaveBeenCalledWith('Testfilm zur Merkliste hinzugefügt', 'added')
  })

  it('zeigt Toast-Nachricht beim Entfernen', () => {
    isInWatchlist.mockReturnValue(true)
    const { toast } = renderWithToast(<WatchlistButton media={movie} />)

    fireEvent.click(screen.getByRole('button'))
    expect(toast).toHaveBeenCalledWith('Testfilm von Merkliste entfernt', 'removed')
  })

  it('stoppt Event-Propagation beim Klick', () => {
    const parentClick = vi.fn()
    renderWithToast(
      <div onClick={parentClick}>
        <WatchlistButton media={movie} />
      </div>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(parentClick).not.toHaveBeenCalled()
  })
})
