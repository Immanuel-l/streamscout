import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import PageLoader from './PageLoader'

describe('PageLoader', () => {
  it('rendert drei animierte Punkte', () => {
    const { container } = render(<PageLoader />)
    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })
})
