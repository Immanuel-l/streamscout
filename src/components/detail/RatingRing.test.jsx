import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RatingRing from './RatingRing'

describe('RatingRing', () => {
  it('zeigt die Bewertung als gerundeten Prozentwert', () => {
    render(<RatingRing rating={6.78} />)

    expect(screen.getByText('68')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it.each([
    [8.0, 'stroke-emerald-500'],
    [5.5, 'stroke-amber-500'],
    [3.0, 'stroke-red-500'],
  ])('nutzt für %s die erwartete Farbe', (rating, expectedClass) => {
    const { container } = render(<RatingRing rating={rating} />)
    const progressCircle = container.querySelectorAll('circle')[1]

    expect(progressCircle).toBeTruthy()
    expect(progressCircle.classList.contains(expectedClass)).toBe(true)
  })
})
