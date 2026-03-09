import { useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { IMAGE_BASE } from '../api/tmdb'
import { useGenres, useWatchProviders } from '../hooks/useProviders'
import MediaCard from '../components/common/MediaCard'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

const ratingOptions = [
  { value: '', label: 'Alle' },
  { value: '9', label: '9+' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
]

function ResultSkeleton({ count = 18 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
          <div className="mt-2 px-1 space-y-1.5">
            <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortBy: 'popularity.desc' },
  { value: 'rating', label: 'Bewertung', sortBy: 'vote_average.desc' },
  { value: 'date', label: 'Erscheinungsdatum', sortBy: 'primary_release_date.desc' },
]

function Discover() {
  const [searchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'popularity')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [year, setYear] = useState('')
  const [rating, setRating] = useState(() => searchParams.get('rating') || '')
  const [selectedProviders, setSelectedProviders] = useState([])

  const genres = useGenres(mediaType)
  const providers = useWatchProviders(mediaType)

  const filterParams = useMemo(() => {
    const sort = sortOptions.find((s) => s.value === sortBy) || sortOptions[0]
    const params = { sort_by: sort.sortBy }
    if (selectedGenres.length > 0) params.with_genres = selectedGenres.join(',')
    if (year) {
      if (mediaType === 'movie') params.primary_release_year = year
      else params.first_air_date_year = year
    }
    if (rating) params['vote_average.gte'] = rating
    if (selectedProviders.length > 0) params.with_watch_providers = selectedProviders.join('|')
    // Bei Sortierung nach Bewertung: Mindestanzahl Votes um obskure Titel zu vermeiden
    if (sortBy === 'rating') params['vote_count.gte'] = 200
    // Bei Sortierung nach Datum: nur bereits erschienene Titel
    if (sortBy === 'date') {
      const today = new Date().toISOString().split('T')[0]
      if (mediaType === 'movie') params['release_date.lte'] = today
      else params['first_air_date.lte'] = today
    }
    return params
  }, [mediaType, selectedGenres, year, rating, selectedProviders, sortBy])

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['discover', mediaType, filterParams],
    queryFn: ({ pageParam = 1 }) => {
      const params = { ...filterParams, page: pageParam }
      return mediaType === 'tv' ? discoverTv(params) : discoverMovies(params)
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= Math.min(lastPage.total_pages, 500) ? next : undefined
    },
    initialPageParam: 1,
    retry: 1,
  })

  const firstPageCount = data?.pages[0]?.results.length || 0

  const allResults = useMemo(
    () =>
      data?.pages.flatMap((page) =>
        page.results.map((m) => ({ ...m, media_type: mediaType }))
      ) || [],
    [data, mediaType]
  )

  // Stable refs so the observer callback always sees latest values
  const fetchRef = useRef(fetchNextPage)
  const hasNextRef = useRef(hasNextPage)
  const isFetchingRef = useRef(isFetchingNextPage)
  fetchRef.current = fetchNextPage
  hasNextRef.current = hasNextPage
  isFetchingRef.current = isFetchingNextPage

  // Callback ref — sets up/tears down observer when sentinel enters/leaves DOM
  const observerRef = useRef(null)
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextRef.current && !isFetchingRef.current) {
            fetchRef.current()
          }
        },
        { rootMargin: '600px' }
      )
      observer.observe(node)
      observerRef.current = observer
    }
  }, [])

  function resetFilters() {
    setSortBy('popularity')
    setSelectedGenres([])
    setYear('')
    setRating('')
    setSelectedProviders([])
  }

  function switchMediaType(type) {
    setMediaType(type)
    setSelectedGenres([])
    setSelectedProviders([])
  }

  function toggleGenre(id) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  function toggleProvider(id) {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const hasFilters = selectedGenres.length > 0 || year || rating || selectedProviders.length > 0 || sortBy !== 'popularity'

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl tracking-wide text-white">Entdecken</h1>

      {/* Media Type Toggle + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {[
            { type: 'movie', label: 'Filme' },
            { type: 'tv', label: 'Serien' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => switchMediaType(type)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaType === type
                  ? 'bg-accent-500 text-black'
                  : 'text-surface-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {sortOptions.map(({ value, label }) => (
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
      </div>

      {/* Filters */}
      <div className="space-y-5">
        {genres.data && (
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Genre</p>
            <div className="flex flex-wrap gap-2">
              {genres.data.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedGenres.includes(g.id)
                      ? 'bg-accent-500 text-black shadow-[0_0_12px_-3px_rgba(245,158,11,0.4)]'
                      : 'bg-surface-800 text-surface-200 hover:bg-surface-700'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Jahr</p>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
            >
              <option value="">Alle Jahre</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Mindestbewertung</p>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
            >
              {ratingOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {providers.data && (
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Streaming-Anbieter</p>
            <div className="flex flex-wrap gap-2">
              {providers.data.map((p) => (
                <button
                  key={p.provider_id}
                  onClick={() => toggleProvider(p.provider_id)}
                  title={p.provider_name}
                  className={`rounded-xl overflow-hidden transition-all duration-300 ${
                    selectedProviders.includes(p.provider_id)
                      ? 'ring-2 ring-accent-400 scale-110 shadow-[0_0_16px_-4px_rgba(245,158,11,0.35)]'
                      : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img
                    src={`${IMAGE_BASE}/w92${p.logo_path}`}
                    alt={p.provider_name}
                    className="w-11 h-11 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Results */}
      {error && (
        <p className="text-red-400 text-sm">Ergebnisse konnten nicht geladen werden. Bitte versuch es später nochmal.</p>
      )}

      {isLoading ? (
        <ResultSkeleton />
      ) : allResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {allResults.map((media, i) => (
              <MediaCard key={`${media.id}-${i}`} media={media} index={i} eager animate={i < firstPageCount} />
            ))}

            {/* Inline skeleton placeholders while fetching */}
            {isFetchingNextPage && Array.from({ length: 12 }).map((_, i) => (
              <div key={`skel-${i}`}>
                <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
                <div className="mt-2 px-1 space-y-1.5">
                  <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Sentinel triggers next fetch when scrolled near */}
          <div ref={sentinelRef} className="h-px" />

          {/* Error on page load — show retry */}
          {error && allResults.length > 0 && !isFetchingNextPage && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm mb-3">Fehler beim Laden weiterer Ergebnisse.</p>
              <button
                onClick={() => fetchNextPage()}
                className="px-4 py-2 rounded-lg bg-surface-800 text-sm font-medium text-surface-200 hover:bg-surface-700 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!hasNextPage && allResults.length > 20 && (
            <p className="text-surface-500 text-sm text-center py-8">Keine weiteren Ergebnisse.</p>
          )}
        </>
      ) : (
        !isLoading && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <p className="text-surface-400 text-lg">Keine Ergebnisse</p>
            <p className="text-surface-500 text-sm mt-1">Versuch andere Filter-Kombinationen.</p>
          </div>
        )
      )}
    </div>
  )
}

export default Discover
