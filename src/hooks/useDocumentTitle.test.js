import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  it('setzt den Titel inklusive Basis-Titel und resetet beim Unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Suche' } }
    )

    expect(document.title).toBe('Suche — StreamScout')

    rerender({ title: null })
    expect(document.title).toBe('StreamScout')

    unmount()
    expect(document.title).toBe('StreamScout')
  })
})
