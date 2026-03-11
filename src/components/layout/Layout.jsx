import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'

function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Global keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handler(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault()
        if (pathname !== '/search') {
          navigate('/search')
        } else {
          document.querySelector('input[type="text"]')?.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname, navigate])

  return (
    <div className="flex flex-col min-h-screen bg-surface-950">
      <Header />
      <main id="main-content" key={pathname} className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
