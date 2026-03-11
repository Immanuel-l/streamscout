import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ScrollToTop from './ScrollToTop'

describe('ScrollToTop', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    window.scrollTo = vi.fn()
  })

  it('ist initial nicht sichtbar', () => {
    render(<ScrollToTop />)
    expect(screen.queryByLabelText('Nach oben scrollen')).not.toBeInTheDocument()
  })

  it('wird sichtbar wenn scrollY > 500', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 600, writable: true })
      fireEvent.scroll(window)
    })
    expect(screen.getByLabelText('Nach oben scrollen')).toBeInTheDocument()
  })

  it('scrollt nach oben beim Klick', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 600, writable: true })
      fireEvent.scroll(window)
    })
    fireEvent.click(screen.getByLabelText('Nach oben scrollen'))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
