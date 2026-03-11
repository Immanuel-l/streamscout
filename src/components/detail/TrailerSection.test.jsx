import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TrailerSection from './TrailerSection'

describe('TrailerSection', () => {
  it('rendert nichts ohne Videos oder ohne passendes YouTube-Video', () => {
    const { container, rerender } = render(<TrailerSection videos={[]} />)
    expect(container.firstChild).toBeNull()

    rerender(<TrailerSection videos={[{ type: 'Trailer', site: 'Vimeo', key: 'abc', name: 'Vimeo Trailer' }]} />)
    expect(container.firstChild).toBeNull()
  })

  it('bevorzugt deutschen Trailer und startet iframe nach Klick', () => {
    render(
      <TrailerSection
        videos={[
          { type: 'Trailer', site: 'YouTube', iso_639_1: 'en', key: 'en123', name: 'English Trailer' },
          { type: 'Trailer', site: 'YouTube', iso_639_1: 'de', key: 'de456', name: 'Deutscher Trailer' },
          { type: 'Teaser', site: 'YouTube', iso_639_1: 'de', key: 'teaser1', name: 'Teaser' },
        ]}
      />
    )

    expect(screen.getByRole('heading', { name: 'Trailer' })).toBeInTheDocument()

    const previewImage = screen.getByAltText('Deutscher Trailer')
    expect(previewImage).toHaveAttribute('src', 'https://img.youtube.com/vi/de456/hqdefault.jpg')

    fireEvent.click(screen.getByRole('button'))

    const frame = screen.getByTitle('Deutscher Trailer')
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/de456?autoplay=1&rel=0')
    expect(frame).toHaveAttribute('allow', expect.stringContaining('autoplay'))
  })

  it('faellt auf Teaser zurueck wenn kein Trailer vorhanden ist', () => {
    render(
      <TrailerSection
        videos={[
          { type: 'Clip', site: 'YouTube', key: 'clip1', name: 'Clip' },
          { type: 'Teaser', site: 'YouTube', key: 'teaser42', name: 'Teaser Name' },
        ]}
      />
    )

    expect(screen.getByAltText('Teaser Name')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/teaser42/hqdefault.jpg'
    )
  })
})
