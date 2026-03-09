import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNowPlaying } from '../hooks/useMovies'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'

function sortKinoMovies(movies, sortBy) {
  if (sortBy === 'popularity') {
    return [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }
  if (sortBy === 'date') return movies
  // 'recommended' — Rang-basierter Mix aus Kinostart + Beliebtheit
  const dateRank = new Map(movies.map((m, i) => [m.id, i]))
  const popSorted = [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  const popRank = new Map(popSorted.map((m, i) => [m.id, i]))
  return [...movies].sort((a, b) =>
    (dateRank.get(a.id) + popRank.get(a.id)) - (dateRank.get(b.id) + popRank.get(b.id))
  )
}

function Kino() {
  const { data, isLoading, error } = useNowPlaying()
  const nowPlayingIds = data?.ids
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recommended')

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (sortBy !== 'recommended') params.sort = sortBy
    setSearchParams(params, { replace: true })
  }, [sortBy, setSearchParams])

  const movies = useMemo(() => {
    const rawMovies = data?.movies || []
    return sortKinoMovies(rawMovies, sortBy)
  }, [data?.movies, sortBy])

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
        <p className="text-surface-300 text-sm mt-1.5">Filme, die gerade in deutschen Kinos laufen.</p>
      </div>

      <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { value: 'recommended', label: 'Empfohlen' },
          { value: 'date', label: 'Kinostart' },
          { value: 'popularity', label: 'Beliebtheit' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === value
                ? 'bg-accent-500 text-black'
                : 'text-surface-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorBox message="Kinofilme konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {isLoading ? (
        <GridSkeleton />
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
