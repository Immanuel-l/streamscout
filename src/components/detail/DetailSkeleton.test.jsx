import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DetailSkeleton from './DetailSkeleton'

describe('DetailSkeleton', () => {
  it('rendert das erwartete Skeleton-Layout', () => {
    const { container } = render(<DetailSkeleton />)

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(Array.from(container.querySelectorAll('div')).some((el) => el.className.includes('h-[30vh]'))).toBe(true)
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.bg-surface-800').length).toBeGreaterThan(3)
  })
})
