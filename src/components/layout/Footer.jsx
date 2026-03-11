import { Link } from 'react-router-dom'

const footerLinks = [
  { to: '/search', label: 'Suche' },
  { to: '/discover', label: 'Entdecken' },
  { to: '/random', label: 'Zufall' },
  { to: '/watchlist', label: 'Merkliste' },
]

function Footer() {
  return (
    <footer className="border-t border-surface-800/60 bg-surface-950 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div className="space-y-3">
            <Link to="/" className="font-display text-2xl tracking-wider text-accent-400 hover:text-accent-300 transition-colors">
              StreamScout
            </Link>
            <p className="text-surface-500 text-sm max-w-xs">
              Finde Filme und Serien auf deinen Streaming-Diensten — schnell, einfach und ohne langes Suchen.
            </p>
          </div>

          <nav className="flex gap-6">
            {footerLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-surface-400 hover:text-surface-100 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-surface-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            Daten bereitgestellt von{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-accent-400 transition-colors"
            >
              TMDB
            </a>
            {' '}&middot;{' '}
            Streaming-Infos von{' '}
            <a
              href="https://www.justwatch.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-accent-400 transition-colors"
            >
              JustWatch
            </a>
          </p>
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
            alt="TMDB Logo"
            className="h-4 opacity-50 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  )
}

export default Footer
