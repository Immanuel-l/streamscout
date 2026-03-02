import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Suche' },
  { to: '/discover', label: 'Entdecken' },
  { to: '/random', label: 'Zufall' },
  { to: '/watchlist', label: 'Merkliste' },
]

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-md border-b border-surface-800">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-display text-3xl tracking-wide text-accent-400 hover:text-accent-300 transition-colors">
          StreamScout
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-accent-400 bg-surface-800'
                    : 'text-surface-200 hover:text-white hover:bg-surface-800/50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className="md:hidden text-surface-200 hover:text-white p-2"
          aria-label="Menü öffnen"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header
