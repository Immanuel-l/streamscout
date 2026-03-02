function Footer() {
  return (
    <footer className="border-t border-surface-800/60 bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-400">
            Daten bereitgestellt von{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 transition-colors"
            >
              TMDB
            </a>
            . Diese App wird nicht von TMDB unterstützt oder zertifiziert.
          </p>
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
            alt="TMDB Logo"
            className="h-5 opacity-60 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  )
}

export default Footer
