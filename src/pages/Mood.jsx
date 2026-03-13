import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { useGenres, useWatchProviders } from '../hooks/useProviders'
import { getMoodBySlug } from '../utils/moods'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import ScrollToTop from '../components/common/ScrollToTop'
import Select from '../components/common/Select'
import ProviderFilter from '../components/common/ProviderFilter'
import FilterPanel from '../components/common/FilterPanel'
import SegmentedControl from '../components/common/SegmentedControl'
import FilterField from '../components/common/FilterField'
import {
  FSK_VALUES,
  FSK_FILTER_MODE_OPTIONS,
  normalizeFskCertification,
  normalizeFskFilterMode,
  setMovieFskFilterParams,
} from '../utils/fsk'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortBy: 'popularity.desc' },
  { value: 'rating', label: 'Bewertung', sortBy: 'vote_average.desc' },
  { value: 'date', label: 'Erscheinungsdatum', sortByMovie: 'primary_release_date.desc', sortByTv: 'first_air_date.desc' },
]

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
  ...FSK_VALUES.map((value) => ({ value, label: `FSK ${value}` })),
]

function Mood() {
  const { slug } = useParams()
  const mood = getMoodBySlug(slug)
  useDocumentTitle(mood?.title)
  const [searchParams, setSearchParams] = useSearchParams()

  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortValue, setSortValue] = useState(() => searchParams.get('sort') || 'popularity')
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const value = searchParams.get('genres')
    return value ? value.split(',').map(Number).filter(Boolean) : []
  })
  const [year, setYear] = useState(() => searchParams.get('year') || '')
  const [rating, setRating] = useState(() => searchParams.get('rating') || '')
  const [selectedProviders, setSelectedProviders] = useState(() => {
    const value = searchParams.get('providers')
    return value ? value.split(',').map(Number).filter(Boolean) : []
  })
  const [fsk, setFsk] = useState(() => normalizeFskCertification(searchParams.get('fsk')) || '')
  const [fskMode, setFskMode] = useState(() => normalizeFskFilterMode(searchParams.get('fskMode')))
  const [startPage, setStartPage] = useState(1)

  const genres = useGenres(mediaType)
  const providers = useWatchProviders(mediaType)


  function resetFilters() {
    setSortValue('popularity')
    setSelectedGenres([])
    setYear('')
    setRating('')
    setSelectedProviders([])
    setFsk('')
    setFskMode('lte')
  }

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (sortValue !== 'popularity') params.sort = sortValue
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',')
    if (year) params.year = year
    if (rating) params.rating = rating
    if (selectedProviders.length > 0) params.providers = selectedProviders.join(',')
    if (fsk) {
      params.fsk = fsk
      if (fskMode !== 'lte') params.fskMode = fskMode
    }
    setSearchParams(params, { replace: true })
  }, [mediaType, sortValue, selectedGenres, year, rating, selectedProviders, fsk, fskMode, setSearchParams])


  const moodParams = mood?.[mediaType] || {}
  const sortOption = sortOptions.find((o) => o.value === sortValue) || sortOptions[0]
  const apiSortBy = sortOption.sortBy || (mediaType === 'tv' ? sortOption.sortByTv : sortOption.sortByMovie)

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['mood', slug, mediaType, sortValue, selectedGenres, year, rating, selectedProviders, fsk, fskMode, startPage],
    queryFn: ({ pageParam }) => {
      const discoverParams = { ...moodParams, sort_by: apiSortBy, page: pageParam }

      if (selectedGenres.length > 0) discoverParams.with_genres = selectedGenres.join(',')
      if (year) {
        if (mediaType === 'movie') discoverParams.primary_release_year = year
        else discoverParams.first_air_date_year = year
      }
      if (rating) discoverParams['vote_average.gte'] = rating
      if (selectedProviders.length > 0) discoverParams.with_watch_providers = selectedProviders.join('|')
      if (fsk && mediaType === 'movie') setMovieFskFilterParams(discoverParams, fsk, fskMode)

      return mediaType === 'tv' ? discoverTv(discoverParams) : discoverMovies(discoverParams)
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= Math.min(lastPage.total_pages, 500) ? next : undefined
    },
    enabled: !!mood,
    retry: 1,
  })

  const firstPageCount = data?.pages[0]?.results.filter((m) => m.poster_path && m.overview).length || 0

  const allResults = useMemo(
    () =>
      data?.pages.flatMap((page) =>
        page.results
          .filter((m) => m.poster_path && m.overview)
          .map((m) => ({ ...m, media_type: mediaType }))
      ) || [],
    [data, mediaType]
  )

  const sentinelRef = useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage })

  function shuffle() {
    setStartPage(Math.floor(Math.random() * 5) + 1)
  }

  function switchMediaType(type) {
    setMediaType(type)
    setSelectedGenres([])
    setSelectedProviders([])
    setFsk('')
    setFskMode('lte')
  }

  function toggleGenre(id) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((genreId) => genreId !== id) : [...prev, id]
    )
  }

  function toggleProvider(id) {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((providerId) => providerId !== id) : [...prev, id]
    )
  }

  const navigate = useNavigate()

  if (!mood) return <Navigate to="/" replace />

  const hasFilters = selectedGenres.length > 0 || year || rating || fsk || selectedProviders.length > 0 || sortValue !== 'popularity'
  const activeFilterCount =
    selectedGenres.length +
    (year ? 1 : 0) +
    (rating ? 1 : 0) +
    (fsk ? 1 : 0) +
    selectedProviders.length +
    (sortValue !== 'popularity' ? 1 : 0)

  const quickFilters = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          size="lg"
          options={[
            { value: 'movie', label: 'Filme' },
            { value: 'tv', label: 'Serien' },
          ]}
          value={mediaType}
          onChange={switchMediaType}
        />

        <SegmentedControl
          options={sortOptions.map(({ value, label }) => ({ value, label }))}
          value={sortValue}
          onChange={setSortValue}
        />

        <button
          onClick={shuffle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 text-surface-200 hover:text-surface-100 hover:bg-surface-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          Mischen
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-surface-400 hover:text-surface-100 transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mood.icon}</span>
          <div>
            <h1 className="font-display text-5xl tracking-wide text-surface-100">{mood.title}</h1>
            <p className="text-surface-300 text-sm mt-1.5 max-w-2xl">{mood.description}</p>
            {mood.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {mood.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FilterPanel
        title="Stimmungs-Filter"
        quickLabel="Schnellfilter"
        quickContent={quickFilters}
        defaultOpen={hasFilters}
        activeCount={activeFilterCount}
        onReset={hasFilters ? resetFilters : undefined}
      >
        {genres.data && (
          <FilterField label="Genre">
            <div className="flex flex-wrap gap-2">
              {genres.data.map((genreOption) => (
                <button
                  key={genreOption.id}
                  onClick={() => toggleGenre(genreOption.id)}
                  aria-pressed={selectedGenres.includes(genreOption.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedGenres.includes(genreOption.id)
                      ? 'bg-accent-500 text-black shadow-[0_0_12px_-3px_rgba(245,158,11,0.4)]'
                      : 'bg-surface-800 text-surface-200 hover:bg-surface-700'
                  }`}
                >
                  {genreOption.name}
                </button>
              ))}
            </div>
          </FilterField>
        )}

        <div className="flex flex-wrap gap-4">
          <FilterField label="Jahr">
            <Select
              value={year}
              onChange={setYear}
              options={[{ value: '', label: 'Alle Jahre' }, ...years.map((itemYear) => ({ value: String(itemYear), label: String(itemYear) }))]}
              placeholder="Alle Jahre"
              ariaLabel="Jahr"
            />
          </FilterField>

          <FilterField label="Bewertung">
            <Select
              value={rating}
              onChange={setRating}
              options={ratingOptions}
              placeholder="Alle"
              ariaLabel="Bewertung"
            />
          </FilterField>
        </div>

        {mediaType === 'movie' && (
          <div className="space-y-3">
            <FilterField label="FSK">
              <Select
                value={fsk}
                onChange={setFsk}
                options={fskOptions}
                placeholder="Alle"
                ariaLabel="FSK"
              />
            </FilterField>

            {fsk && (
              <SegmentedControl
                size="sm"
                className="w-fit"
                options={FSK_FILTER_MODE_OPTIONS}
                value={fskMode}
                onChange={setFskMode}
              />
            )}
          </div>
        )}

        <ProviderFilter
          providers={providers.data}
          selected={selectedProviders}
          onToggle={toggleProvider}
        />

      </FilterPanel>

      {/* Results */}
      {error && <ErrorBox message="Ergebnisse konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {isLoading ? (
        <GridSkeleton />
      ) : allResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {allResults.map((media, i) => (
              <MediaCard key={`${media.id}-${i}`} media={media} index={i} eager animate={i < firstPageCount} />
            ))}

            {hasNextPage && (
              <div ref={sentinelRef} className="col-span-full h-px" />
            )}

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

          {error && allResults.length > 0 && !isFetchingNextPage && (
            <div className="py-8 max-w-md mx-auto">
              <ErrorBox message="Fehler beim Laden weiterer Ergebnisse." onRetry={() => fetchNextPage()} />
            </div>
          )}

          {!hasNextPage && allResults.length > 20 && (
            <p className="text-surface-500 text-sm text-center py-8">Keine weiteren Ergebnisse.</p>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
          <p className="text-surface-400 text-lg">Keine Ergebnisse gefunden</p>
          <p className="text-surface-500 text-sm mt-1">Versuch es mit {mediaType === 'movie' ? 'Serien' : 'Filmen'} statt {mediaType === 'movie' ? 'Filmen' : 'Serien'}.</p>
        </div>
      )}

      <ScrollToTop />
    </div>
  )
}

export default Mood


