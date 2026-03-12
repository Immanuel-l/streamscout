import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Mock alle lazy-loaded Pages
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
  it('rendert die Home-Seite auf "/"', async () => {
    renderApp('/')
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument()
    })
  })

  it('rendert die Search-Seite auf "/search"', async () => {
    renderApp('/search')
    await waitFor(() => {
      expect(screen.getByTestId('page-search')).toBeInTheDocument()
    })
  })

  it('rendert die Discover-Seite auf "/discover"', async () => {
    renderApp('/discover')
    await waitFor(() => {
      expect(screen.getByTestId('page-discover')).toBeInTheDocument()
    })
  })

  it('rendert die MovieDetail-Seite auf "/movie/:id"', async () => {
    renderApp('/movie/123')
    await waitFor(() => {
      expect(screen.getByTestId('page-movie-detail')).toBeInTheDocument()
    })
  })

  it('rendert die TvDetail-Seite auf "/tv/:id"', async () => {
    renderApp('/tv/456')
    await waitFor(() => {
      expect(screen.getByTestId('page-tv-detail')).toBeInTheDocument()
    })
  })

  it('rendert die PersonDetail-Seite auf "/person/:id"', async () => {
    renderApp('/person/789')
    await waitFor(() => {
      expect(screen.getByTestId('page-person-detail')).toBeInTheDocument()
    })
  })

  it('rendert die Watchlist-Seite auf "/watchlist"', async () => {
    renderApp('/watchlist')
    await waitFor(() => {
      expect(screen.getByTestId('page-watchlist')).toBeInTheDocument()
    })
  })

  it('rendert die Random-Seite auf "/random"', async () => {
    renderApp('/random')
    await waitFor(() => {
      expect(screen.getByTestId('page-random')).toBeInTheDocument()
    })
  })

  it('rendert die Mood-Seite auf "/mood/:slug"', async () => {
    renderApp('/mood/action')
    await waitFor(() => {
      expect(screen.getByTestId('page-mood')).toBeInTheDocument()
    })
  })

  it('rendert die Anime-Seite auf "/anime"', async () => {
    renderApp('/anime')
    await waitFor(() => {
      expect(screen.getByTestId('page-anime')).toBeInTheDocument()
    })
  })

  it('rendert die Kino-Seite auf "/kino"', async () => {
    renderApp('/kino')
    await waitFor(() => {
      expect(screen.getByTestId('page-kino')).toBeInTheDocument()
    })
  })

  it('rendert die NotFound-Seite auf unbekannten Pfaden', async () => {
    renderApp('/unbekannter-pfad')
    await waitFor(() => {
      expect(screen.getByTestId('page-not-found')).toBeInTheDocument()
    })
  })

  it('rendert das Layout um alle Routen', async () => {
    renderApp('/')
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })
})
