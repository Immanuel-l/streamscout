import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNowPlaying } from '../hooks/useMovies'
import { getMovieReleaseDates } from '../api/movies'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import Select from '../components/common/Select'
import {
  FSK_VALUES,
  FSK_FILTER_MODE_OPTIONS,
  normalizeFskCertification,
  normalizeFskFilterMode,
  getMovieFskCertificationFromReleaseDates,
  matchesFskFilter,
} from '../utils/fsk'

function sortKinoMovies(movies, sortBy) {
  if (sortBy === 'popularity') {
    return [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }
  if (sortBy === 'date') return movies
  // 'recommended' - Rang-basierter Mix aus Kinostart + Beliebtheit
  const dateRank = new Map(movies.map((m, i) => [m.id, i]))
  const popSorted = [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  const popRank = new Map(popSorted.map((m, i) => [m.id, i]))
  return [...movies].sort((a, b) =>
    (dateRank.get(a.id) + popRank.get(a.id)) - (dateRank.get(b.id) + popRank.get(b.id))
  )
}

const fskOptions = [
  { value: '', label: 'Alle' },
  ...FSK_VALUES.map((value) => ({ value, label: `FSK ${value}` })),
]

function Kino() {
  useDocumentTitle('Aktuell im Kino')
  const { data, isLoading, error } = useNowPlaying()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recommended')
  const [fsk, setFsk] = useState(() => normalizeFskCertification(searchParams.get('fsk')) || '')
  const [fskMode, setFskMode] = useState(() => normalizeFskFilterMode(searchParams.get('fskMode')))
  const [fskByMovieId, setFskByMovieId] = useState({})
  const [fskLoading, setFskLoading] = useState(false)
  const fskCacheRef = useRef(new Map())

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (sortBy !== 'recommended') params.sort = sortBy
    if (fsk) {
      params.fsk = fsk
      if (fskMode !== 'lte') params.fskMode = fskMode
    }
    setSearchParams(params, { replace: true })
  }, [sortBy, fsk, fskMode, setSearchParams])

  const movies = useMemo(() => {
    const rawMovies = data?.movies || []
    return sortKinoMovies(rawMovies, sortBy)
  }, [data?.movies, sortBy])

  useEffect(() => {
    let isCancelled = false

    async function loadMovieFskData() {
      if (!fsk || movies.length === 0) {
        setFskLoading(false)
        return
      }

      const missingMovies = movies.filter((movie) => !fskCacheRef.current.has(movie.id))

      if (missingMovies.length > 0) {
        setFskLoading(true)

        const entries = await Promise.all(
          missingMovies.map(async (movie) => {
            try {
              const releaseDates = await getMovieReleaseDates(movie.id)
              const certification = getMovieFskCertificationFromReleaseDates(releaseDates)
              return [movie.id, certification]
            } catch {
              return [movie.id, null]
            }
          })
        )

        if (isCancelled) return

        for (const [movieId, certification] of entries) {
          fskCacheRef.current.set(movieId, certification)
        }
      }

      const nextMap = {}
      for (const movie of movies) {
        nextMap[movie.id] = fskCacheRef.current.get(movie.id) ?? null
      }

      if (!isCancelled) {
        setFskByMovieId(nextMap)
        setFskLoading(false)
      }
    }

    loadMovieFskData()

    return () => {
      isCancelled = true
    }
  }, [movies, fsk])

  const filteredMovies = useMemo(() => {
    if (!fsk) return movies
    return movies.filter((movie) => matchesFskFilter(fskByMovieId[movie.id], fsk, fskMode))
  }, [movies, fskByMovieId, fsk, fskMode])

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="text-sm text-surface-400 hover:text-surface-100 transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </Link>
        <h1 className="font-display text-5xl tracking-wide text-surface-100">Aktuell im Kino</h1>
        <p className="text-surface-300 text-sm mt-1.5">Filme, die gerade in deutschen Kinos laufen.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
                  : 'text-surface-300 hover:text-surface-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Select
            value={fsk}
            onChange={setFsk}
            options={fskOptions}
            placeholder="FSK"
          />

          {fsk && (
            <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
              {FSK_FILTER_MODE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFskMode(value)}
                  aria-pressed={fskMode === value}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    fskMode === value
                      ? 'bg-accent-500 text-black'
                      : 'text-surface-300 hover:text-surface-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBox message="Kinofilme konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {(isLoading || (fsk && fskLoading)) ? (
        <GridSkeleton />
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredMovies.map((media, i) => (
            <MediaCard key={media.id} media={media} index={i} eager />
          ))}
        </div>
      ) : (
        <p className="text-surface-400 text-lg text-center py-20">
          {fsk ? 'Keine Kinofilme für diesen FSK-Filter verfügbar.' : 'Keine Kinofilme verfügbar.'}
        </p>
      )}
    </div>
  )
}

export default Kino
