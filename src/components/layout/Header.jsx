import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Suche' },
  { to: '/discover', label: 'Entdecken' },
  { to: '/random', label: 'Zufall' },
  { to: '/watchlist', label: 'Merkliste' },
]

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = useCallback(() => setMobileOpen(false), [])

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen, close])

  return (
    <div className="sticky top-0 z-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent-500 focus:text-black focus:text-sm focus:font-medium"
      >
        Zum Inhalt springen
      </a>
      <header className="w-full bg-surface-950/80 backdrop-blur-md pt-[env(safe-area-inset-top)] border-b border-accent-500/10" style={{ boxShadow: '0 1px 20px -4px rgba(245, 158, 11, 0.08)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display text-3xl tracking-wider text-accent-400 hover:text-accent-300 transition-colors"
          >
            StreamScout
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent-400 bg-accent-400/10'
                      : 'text-surface-300 hover:text-white hover:bg-surface-800/60'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-surface-300 hover:text-white p-2 rounded-lg hover:bg-surface-800/60 transition-colors"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Backdrop overlay — closes menu on tap outside */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[-1] bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <nav
        className={`md:hidden absolute left-0 w-full border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out shadow-2xl ${
          mobileOpen ? 'max-h-80 opacity-100 border-t border-surface-800/60' : 'max-h-0 opacity-0 border-t-transparent'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={close}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-accent-400 bg-accent-400/10'
                    : 'text-surface-300 hover:text-white hover:bg-surface-800/60'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default Header
