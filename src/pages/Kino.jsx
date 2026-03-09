import { Link } from 'react-router-dom'
import { useNowPlaying } from '../hooks/useMovies'
import MediaCard from '../components/common/MediaCard'

function Kino() {
  const { data, isLoading, error } = useNowPlaying()
  const movies = data?.movies || []
  const nowPlayingIds = data?.ids

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="text-sm text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </Link>
        <h1 className="font-display text-5xl tracking-wide text-white">Aktuell im Kino</h1>
        <p className="text-surface-300 text-sm mt-1.5">Filme, die gerade in deutschen Kinos laufen — sortiert nach Kinostart.</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm">Kinofilme konnten nicht geladen werden. Bitte versuch es später nochmal.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
              <div className="mt-2 px-1 space-y-1.5">
                <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {movies.map((media, i) => (
            <MediaCard key={media.id} media={media} index={i} eager nowPlayingIds={nowPlayingIds} />
          ))}
        </div>
      ) : (
        <p className="text-surface-400 text-lg text-center py-20">Keine Kinofilme verfügbar.</p>
      )}
    </div>
  )
}

export default Kino
