import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RatingRing from './RatingRing'

describe('RatingRing', () => {
  it('zeigt den Score als Prozent an', () => {
    render(<RatingRing rating={7.5} />)
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('rundet den Score korrekt', () => {
    render(<RatingRing rating={6.78} />)
    expect(screen.getByText('68')).toBeInTheDocument()
  })

  it('rendert ein SVG mit zwei Kreisen', () => {
    const { container } = render(<RatingRing rating={8.0} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
  })

  it('nutzt grüne Farbe für hohe Bewertungen (>= 70)', () => {
    const { container } = render(<RatingRing rating={8.0} />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle.classList.contains('stroke-emerald-500')).toBe(true)
  })

  it('nutzt gelbe Farbe für mittlere Bewertungen (50-69)', () => {
    const { container } = render(<RatingRing rating={5.5} />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle.classList.contains('stroke-amber-500')).toBe(true)
  })

  it('nutzt rote Farbe für niedrige Bewertungen (< 50)', () => {
    const { container } = render(<RatingRing rating={3.0} />)
    const progressCircle = container.querySelectorAll('circle')[1]
    expect(progressCircle.classList.contains('stroke-red-500')).toBe(true)
  })
})
