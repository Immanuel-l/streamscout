import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PersonDetail from './PersonDetail'

let mockId = '501'
const mockUseDocumentTitle = vi.fn()
const mockUsePersonDetails = vi.fn()
const mockUsePersonCredits = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: mockId }),
  }
})

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../hooks/usePerson', () => ({
  usePersonDetails: (...args) => mockUsePersonDetails(...args),
  usePersonCredits: (...args) => mockUsePersonCredits(...args),
}))

vi.mock('../api/tmdb', () => ({
  IMAGE_BASE: 'https://image.tmdb.org/t/p',
}))

vi.mock('../components/common/MediaCard', () => ({
  default: ({ media }) => <div data-testid="media-card">{media.title || media.name}</div>,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <PersonDetail />
    </MemoryRouter>
  )
}

function createCredits(count, prefix, mediaType = 'movie') {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    media_type: mediaType,
    credit_id: `${prefix}-${i + 1}`,
    title: `${prefix} ${i + 1}`,
  }))
}

describe('PersonDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockId = '501'
    mockUsePersonDetails.mockReturnValue({ data: null, isLoading: false, error: null })
    mockUsePersonCredits.mockReturnValue({ data: { cast: [], crew: [] }, isLoading: false, error: null })
  })

  it('zeigt Skeleton waehrend Loading', () => {
    mockUsePersonDetails.mockReturnValue({ data: undefined, isLoading: true, error: null })

    const { container } = renderPage()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByTestId('error-box')).not.toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehler', () => {
    mockUsePersonDetails.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') })

    renderPage()
    expect(screen.getByTestId('error-box')).toHaveTextContent('Person konnte nicht geladen werden.')
  })

  it('rendert null wenn keine Person vorhanden ist', () => {
    mockUsePersonDetails.mockReturnValue({ data: null, isLoading: false, error: null })

    const { container } = renderPage()
    expect(container).toBeEmptyDOMElement()
  })

  it('rendert Header, lange Biografie und begrenzt Filmografie-Listen', () => {
    const person = {
      id: 501,
      name: 'Max Mustermann',
      profile_path: '/max.jpg',
      known_for_department: 'Acting',
      gender: 2,
      birthday: '1990-01-01',
      deathday: null,
      place_of_birth: 'Berlin, Germany',
      biography: 'Lang '.repeat(200),
    }

    mockUsePersonDetails.mockReturnValue({ data: person, isLoading: false, error: null })
    mockUsePersonCredits.mockReturnValue({
      data: {
        cast: createCredits(30, 'Cast'),
        crew: createCredits(20, 'Crew', 'tv'),
      },
      isLoading: false,
      error: null,
    })

    renderPage()

    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Max Mustermann')
    expect(screen.getByText('Schauspiel')).toBeInTheDocument()
    expect(screen.getByText('Männlich')).toBeInTheDocument()
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument()

    expect(screen.getByText('Bekannt für (30)')).toBeInTheDocument()
    expect(screen.getByText('Hinter der Kamera (20)')).toBeInTheDocument()
    expect(screen.getAllByTestId('media-card')).toHaveLength(42)

    const toggle = screen.getByText('Mehr anzeigen')
    fireEvent.click(toggle)
    expect(screen.getByText('Weniger anzeigen')).toBeInTheDocument()
  })

  it('zeigt Fallbacks ohne Foto und ohne lange Biografie korrekt', () => {
    const person = {
      id: 502,
      name: 'Alex Sample',
      profile_path: null,
      known_for_department: 'Visual Effects',
      gender: 3,
      birthday: '1990-01-01',
      deathday: '2020-01-01',
      place_of_birth: 'Hamburg, Germany',
      biography: 'Kurz',
    }

    mockUsePersonDetails.mockReturnValue({ data: person, isLoading: false, error: null })
    mockUsePersonCredits.mockReturnValue({ data: { cast: [], crew: [] }, isLoading: false, error: null })

    renderPage()

    expect(screen.queryByAltText('Alex Sample')).not.toBeInTheDocument()
    expect(screen.getByText('Visual Effects')).toBeInTheDocument()
    expect(screen.getByText('Nicht-binär')).toBeInTheDocument()
    expect(screen.getByText(/†/)).toBeInTheDocument()

    expect(screen.queryByText('Mehr anzeigen')).not.toBeInTheDocument()
    expect(screen.queryByText(/Bekannt für/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Hinter der Kamera/)).not.toBeInTheDocument()
  })
})
