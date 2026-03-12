import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WatchlistRecommendations from './WatchlistRecommendations'

vi.mock('../../hooks/useWatchlistRecommendations', () => ({
  useWatchlistRecommendations: vi.fn(),
}))

import { useWatchlistRecommendations } from '../../hooks/useWatchlistRecommendations'

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}


describe('WatchlistRecommendations', () => {
  it('rendert nichts wenn keine Daten und nicht loading', () => {
    useWatchlistRecommendations.mockReturnValue({ data: [], isLoading: false, error: null })
    const { container } = renderWithProviders(<WatchlistRecommendations />)
    expect(container.firstChild).toBeNull()
  })

  it('zeigt Loading-Skeleton wenn Loading ohne Daten', () => {
    useWatchlistRecommendations.mockReturnValue({ data: [], isLoading: true, error: null })
    renderWithProviders(<WatchlistRecommendations />)
    expect(screen.getByText('Empfehlungen für dich')).toBeInTheDocument()
  })

  it('rendert Empfehlungen mit Quelltitel', () => {
    useWatchlistRecommendations.mockReturnValue({
      data: [
        {
          sourceItem: { id: 1, media_type: 'movie', title: 'Inception' },
          recommendations: [
            { id: 10, title: 'Interstellar', media_type: 'movie', poster_path: '/p.jpg', vote_average: 8.6 },
          ],
        },
      ],
      isLoading: false,
      error: null,
    })
    renderWithProviders(<WatchlistRecommendations />)
    expect(screen.getByText(/Inception/)).toBeInTheDocument()
  })
})

