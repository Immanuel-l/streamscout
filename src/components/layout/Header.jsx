import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Suche' },
  { to: '/discover', label: 'Entdecken' },
  { to: '/random', label: 'Zufall' },
  { to: '/watchlist', label: 'Merkliste' },
]

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

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
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800/60 transition-colors"
              aria-label={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800/60 transition-colors"
              aria-label={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-surface-300 hover:text-white p-2 rounded-lg hover:bg-surface-800/60 transition-colors"
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
