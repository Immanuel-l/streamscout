import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'

describe('Layout', () => {
  it('rendert Header, Main-Content und Footer', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<p>Testinhalt</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getAllByText('StreamScout').length).toBeGreaterThan(0)
    expect(screen.getByText('Testinhalt')).toBeInTheDocument()
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('scrollt bei Route-Wechsel nach oben', () => {
    window.scrollTo = vi.fn()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<p>Home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
