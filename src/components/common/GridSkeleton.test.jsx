import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GridSkeleton from './GridSkeleton'

describe('GridSkeleton', () => {
  it('rendert Standard-Anzahl von 18 Skeleton-Elementen', () => {
    const { container } = render(<GridSkeleton />)
    const items = container.querySelectorAll('.aspect-\\[2\\/3\\]')
    expect(items).toHaveLength(18)
  })

  it('rendert benutzerdefinierte Anzahl', () => {
    const { container } = render(<GridSkeleton count={6} />)
    const items = container.querySelectorAll('.aspect-\\[2\\/3\\]')
    expect(items).toHaveLength(6)
  })

  it('hat Grid-Layout-Klassen', () => {
    const { container } = render(<GridSkeleton count={1} />)
    expect(container.firstChild).toHaveClass('grid')
  })
})
