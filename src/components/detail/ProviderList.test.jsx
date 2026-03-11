import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProviderList from './ProviderList'

vi.mock('../../api/tmdb', () => ({
  IMAGE_BASE: 'https://img.test',
}))

describe('ProviderList', () => {
  it('zeigt Fallback-Hinweis wenn keine passenden Anbieter vorhanden sind', () => {
    const { rerender } = render(<ProviderList providers={undefined} />)
    expect(screen.getByText(/Bei unseren Anbietern nicht ver/i)).toBeInTheDocument()

    rerender(
      <ProviderList
        providers={{
          link: 'https://justwatch.com/de',
          flatrate: [{ provider_id: 9999, provider_name: 'Unknown', logo_path: '/x.png' }],
          rent: [],
          buy: [],
        }}
      />
    )

    expect(screen.getByText(/Bei unseren Anbietern nicht ver/i)).toBeInTheDocument()
  })

  it('rendert nur erlaubte Anbieter und vorhandene Sektionen', () => {
    render(
      <ProviderList
        providers={{
          link: 'https://justwatch.com/de/titel',
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' },
            { provider_id: 9999, provider_name: 'Unknown', logo_path: '/x.png' },
          ],
          rent: [{ provider_id: 9, provider_name: 'Prime Video', logo_path: '/prime.png' }],
          buy: [{ provider_id: 9999, provider_name: 'Unknown Buy', logo_path: '/y.png' }],
        }}
      />
    )

    expect(screen.getByText('Streaming-Abo')).toBeInTheDocument()
    expect(screen.getByText('Leihen')).toBeInTheDocument()
    expect(screen.queryByText('Kaufen')).not.toBeInTheDocument()

    expect(screen.getByAltText('Netflix')).toHaveAttribute('src', 'https://img.test/w92/netflix.png')
    expect(screen.getByAltText('Prime Video')).toHaveAttribute('src', 'https://img.test/w92/prime.png')
    expect(screen.queryByAltText('Unknown')).not.toBeInTheDocument()

    const netflixLink = screen.getByTitle('Netflix – Verfügbarkeit anzeigen')
    expect(netflixLink).toHaveAttribute('href', 'https://justwatch.com/de/titel')
    expect(netflixLink).toHaveAttribute('target', '_blank')
    expect(netflixLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('zeigt JustWatch-Quellenhinweis mit sicherem externen Link', () => {
    render(
      <ProviderList
        providers={{
          link: 'https://justwatch.com/de/titel',
          flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }],
        }}
      />
    )

    const justwatchLink = screen.getByText('JustWatch').closest('a')
    expect(justwatchLink).toHaveAttribute('href', 'https://www.justwatch.com/')
    expect(justwatchLink).toHaveAttribute('target', '_blank')
    expect(justwatchLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

