import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { useGenres, useWatchProviders } from '../hooks/useProviders'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import Select from '../components/common/Select'
import ProviderFilter from '../components/common/ProviderFilter'
import ScrollToTop from '../components/common/ScrollToTop'
import { t } from '../utils/i18n'

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

const fskOptions = [
  { value: '', label: 'Alle' },
  { value: 'FSK 0', label: 'FSK 0' },
  { value: 'FSK 6', label: 'FSK 6' },
  { value: 'FSK 12', label: 'FSK 12' },
  { value: 'FSK 16', label: 'FSK 16' },
  { value: 'FSK 18', label: 'FSK 18' },
]

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortBy: 'popularity.desc' },
  { value: 'rating', label: 'Bewertung', sortBy: 'vote_average.desc' },
  { value: 'date', label: 'Erscheinungsdatum', sortBy: 'primary_release_date.desc' },
]

function Discover() {
  useDocumentTitle('Entdecken')
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'popularity')
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const g = searchParams.get('genres')
    return g ? g.split(',').map(Number).filter(Boolean) : []
  })
  const [year, setYear] = useState(() => searchParams.get('year') || '')
  const [rating, setRating] = useState(() => searchParams.get('rating') || '')
  const [selectedProviders, setSelectedProviders] = useState(() => {
    const p = searchParams.get('providers')
    return p ? p.split(',').map(Number).filter(Boolean) : []
  })
  const [fsk, setFsk] = useState(() => searchParams.get('fsk') || '')

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (sortBy !== 'popularity') params.sort = sortBy
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',')
    if (year) params.year = year
    if (rating) params.rating = rating
    if (selectedProviders.length > 0) params.providers = selectedProviders.join(',')
    if (fsk) params.fsk = fsk
    setSearchParams(params, { replace: true })
  }, [mediaType, sortBy, selectedGenres, year, rating, selectedProviders, fsk, setSearchParams])

  const genres = useGenres(mediaType)
  const providers = useWatchProviders(mediaType)

  const filterParams = useMemo(() => {
    const sort = sortOptions.find((s) => s.value === sortBy) || sortOptions[0]
    let sortParam = sort.sortBy
    if (sortBy === 'date' && mediaType === 'tv') sortParam = 'first_air_date.desc'
    const params = { sort_by: sortParam }
    if (selectedGenres.length > 0) params.with_genres = selectedGenres.join(',')
    if (year) {
      if (mediaType === 'movie') params.primary_release_year = year
      else params.first_air_date_year = year
    }
    if (rating) params['vote_average.gte'] = rating
    if (selectedProviders.length > 0) params.with_watch_providers = selectedProviders.join('|')
    if (fsk && mediaType === 'movie') {
      params.certification_country = 'DE'
      params['certification.lte'] = fsk
    }
    // Bei Sortierung nach Bewertung: Mindestanzahl Votes um obskure Titel zu vermeiden
    if (sortBy === 'rating') params['vote_count.gte'] = 200
    // Bei Sortierung nach Datum: nur bereits erschienene Titel
    if (sortBy === 'date') {
      const today = new Date().toISOString().split('T')[0]
      if (mediaType === 'movie') params['release_date.lte'] = today
      else params['first_air_date.lte'] = today
    }
    return params
  }, [mediaType, selectedGenres, year, rating, selectedProviders, fsk, sortBy])

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
      data?.pages.flatMap((page, pageIndex) =>
        page.results.map((m) => ({ ...m, media_type: mediaType, _pageIndex: pageIndex }))
      ) || [],
    [data, mediaType]
  )

  const sentinelRef = useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage })

  function resetFilters() {
    setSortBy('popularity')
    setSelectedGenres([])
    setYear('')
    setRating('')
    setFsk('')
    setSelectedProviders([])
  }

  function switchMediaType(type) {
    setMediaType(type)
    setSelectedGenres([])
    setSelectedProviders([])
    setFsk('')
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

  const hasFilters = selectedGenres.length > 0 || year || rating || fsk || selectedProviders.length > 0 || sortBy !== 'popularity'

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl tracking-wide text-surface-100">{t('discover.title')}</h1>

      {/* Media Type Toggle + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {[
            { type: 'movie', label: t('discover.movies') },
            { type: 'tv', label: t('discover.tv') },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => switchMediaType(type)}
              aria-pressed={mediaType === type}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaType === type
                  ? 'bg-accent-500 text-black'
                  : 'text-surface-200 hover:text-surface-100'
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
              aria-pressed={sortBy === value}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === value
                  ? 'bg-accent-500 text-black'
                  : 'text-surface-200 hover:text-surface-100'
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
            <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">{t('discover.genre')}</p>
            <div className="flex flex-wrap gap-2">
              {genres.data.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  aria-pressed={selectedGenres.includes(g.id)}
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
            <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">{t('discover.year')}</p>
            <Select
              value={year}
              onChange={setYear}
              options={[{ value: '', label: t('discover.allYears') }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
              placeholder={t('discover.allYears')}
              ariaLabel={t('discover.year')}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">{t('discover.rating')}</p>
            <Select
              value={rating}
              onChange={setRating}
              options={ratingOptions}
              placeholder="Alle"
              ariaLabel={t('discover.rating')}
            />
          </div>

          {mediaType === 'movie' && (
            <div>
              <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">{t('discover.fsk')}</p>
              <Select
                value={fsk}
                onChange={setFsk}
                options={fskOptions}
                placeholder="Alle"
                ariaLabel={t('discover.fsk')}
              />
            </div>
          )}
        </div>

        <ProviderFilter
          providers={providers.data}
          selected={selectedProviders}
          onToggle={toggleProvider}
        />

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
          >
            {t('discover.resetFilters')}
          </button>
        )}
      </div>

      {/* Results */}
      {error && <ErrorBox message="Ergebnisse konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {isLoading ? (
        <GridSkeleton />
      ) : allResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {allResults.map((media, i) => (
              <MediaCard key={`${media.media_type}-${media.id}-p${media._pageIndex}`} media={media} index={i} eager animate={i < firstPageCount} />
            ))}

            {/* Sentinel inside grid, before skeletons — prevents oscillation */}
            {hasNextPage && (
              <div ref={sentinelRef} className="col-span-full h-px" />
            )}

            {/* Inline skeleton placeholders while fetching */}
            {isFetchingNextPage && Array.from({ length: 6 }).map((_, i) => (
              <div key={`skel-${i}`}>
                <div className="aspect-[2/3] rounded-xl bg-surface-800 animate-pulse" />
                <div className="mt-2 px-1 space-y-1.5">
                  <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Error on page load — show retry */}
          {error && allResults.length > 0 && !isFetchingNextPage && (
            <div className="py-8 max-w-md mx-auto">
              <ErrorBox message="Fehler beim Laden weiterer Ergebnisse." onRetry={() => fetchNextPage()} />
            </div>
          )}

          {!hasNextPage && allResults.length > 20 && (
            <p className="text-surface-200 text-sm text-center py-8">Keine weiteren Ergebnisse.</p>
          )}
        </>
      ) : (
        !isLoading && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <p className="text-surface-200 text-lg">{t('discover.noResults')}</p>
            <p className="text-surface-200 text-sm mt-1">{t('discover.noResultsHint')}</p>
          </div>
        )
      )}

      <ScrollToTop />
    </div>
  )
}

export default Discover






