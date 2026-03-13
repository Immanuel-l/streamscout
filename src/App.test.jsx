import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

vi.mock('./pages/Home', () => ({
  default: () => <div data-testid="page-home">Home Page</div>,
}))

vi.mock('./pages/Search', () => ({
  default: () => <div data-testid="page-search">Search Page</div>,
}))

vi.mock('./pages/Discover', () => ({
  default: () => <div data-testid="page-discover">Discover Page</div>,
}))

vi.mock('./pages/MovieDetail', () => ({
  default: () => <div data-testid="page-movie-detail">Movie Detail Page</div>,
}))

vi.mock('./pages/TvDetail', () => ({
  default: () => <div data-testid="page-tv-detail">TV Detail Page</div>,
}))

vi.mock('./pages/Watchlist', () => ({
  default: () => <div data-testid="page-watchlist">Watchlist Page</div>,
}))

vi.mock('./pages/Random', () => ({
  default: () => <div data-testid="page-random">Random Page</div>,
}))

vi.mock('./pages/Mood', () => ({
  default: () => <div data-testid="page-mood">Mood Page</div>,
}))

vi.mock('./pages/Anime', () => ({
  default: () => <div data-testid="page-anime">Anime Page</div>,
}))

vi.mock('./pages/Kino', () => ({
  default: () => <div data-testid="page-kino">Kino Page</div>,
}))

vi.mock('./pages/PersonDetail', () => ({
  default: () => <div data-testid="page-person-detail">Person Detail Page</div>,
}))

vi.mock('./pages/NotFound', () => ({
  default: () => <div data-testid="page-not-found">Not Found Page</div>,
}))

vi.mock('./components/layout/Layout', async () => {
  const { Outlet } = await import('react-router-dom')
  return {
    default: () => (
      <div data-testid="layout">
        <Outlet />
      </div>
    ),
  }
})

function renderApp(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('App Routing', () => {
  it('rendert Layout und Home auf der Startseite', async () => {
    renderApp('/')

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      expect(screen.getByTestId('page-home')).toBeInTheDocument()
    })
  })

  it.each([
    ['/search', 'page-search'],
    ['/discover', 'page-discover'],
    ['/movie/123', 'page-movie-detail'],
    ['/tv/456', 'page-tv-detail'],
    ['/person/789', 'page-person-detail'],
    ['/watchlist', 'page-watchlist'],
    ['/random', 'page-random'],
    ['/mood/action', 'page-mood'],
    ['/anime', 'page-anime'],
    ['/kino', 'page-kino'],
  ])('rendert für %s die passende Seite', async (route, testId) => {
    renderApp(route)

    await waitFor(() => {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    })
  })

  it('rendert bei unbekannter Route die NotFound-Seite', async () => {
    renderApp('/unbekannter-pfad')

    await waitFor(() => {
      expect(screen.getByTestId('page-not-found')).toBeInTheDocument()
    })
  })
})
