import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies, getMovieReleaseDates } from '../api/movies'
import { discoverTv, getTvContentRatings } from '../api/tv'
import { posterUrl, backdropUrl } from '../api/tmdb'
import { useGenres, useWatchProviders } from '../hooks/useProviders'
import WatchlistButton from '../components/common/WatchlistButton'
import ErrorBox from '../components/common/ErrorBox'
import Select from '../components/common/Select'
import ProviderFilter from '../components/common/ProviderFilter'
import FilterPanel from '../components/common/FilterPanel'
import {
  FSK_VALUES,
  FSK_FILTER_MODE_OPTIONS,
  normalizeFskCertification,
  normalizeFskFilterMode,
  setMovieFskFilterParams,
  getMovieFskLabelFromReleaseDates,
  getTvFskLabelFromContentRatings,
} from '../utils/fsk'

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
  ...FSK_VALUES.map((value) => ({ value, label: `FSK ${value}` })),
]

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortByMovie: 'popularity.desc', sortByTv: 'popularity.desc' },
  { value: 'rating', label: 'Bewertung', sortByMovie: 'vote_average.desc', sortByTv: 'vote_average.desc' },
  { value: 'date', label: 'Erscheinungsdatum', sortByMovie: 'primary_release_date.desc', sortByTv: 'first_air_date.desc' },
]

const MAX_RETRIES = 3


function Random() {
  useDocumentTitle('Zufallsgenerator')
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'popularity')
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const value = searchParams.get('genres')
    return value ? value.split(',').map(Number).filter(Boolean) : []
  })
  const [year, setYear] = useState(() => searchParams.get('year') || '')
  const [rating, setRating] = useState(() => searchParams.get('rating') || '')
  const [fsk, setFsk] = useState(() => normalizeFskCertification(searchParams.get('fsk')) || '')
  const [fskMode, setFskMode] = useState(() => normalizeFskFilterMode(searchParams.get('fskMode')))
  const [selectedProviders, setSelectedProviders] = useState(() => {
    const p = searchParams.get('providers')
    return p ? p.split(',').map(Number).filter(Boolean) : []
  })

  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (sortBy !== 'popularity') params.sort = sortBy
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',')
    if (year) params.year = year
    if (rating) params.rating = rating
    if (fsk) {
      params.fsk = fsk
      if (fskMode !== 'lte') params.fskMode = fskMode
    }
    if (selectedProviders.length > 0) params.providers = selectedProviders.join(',')
    setSearchParams(params, { replace: true })
  }, [mediaType, sortBy, selectedGenres, year, rating, fsk, fskMode, selectedProviders, setSearchParams])

  const [result, setResult] = useState(null)
  const [resultFskLabel, setResultFskLabel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fskCacheRef = useRef(new Map())

  const genres = useGenres(mediaType)
  const providers = useWatchProviders(mediaType)

  useEffect(() => {
    let isCancelled = false

    async function loadResultFsk() {
      if (!result) {
        setResultFskLabel(null)
        return
      }

      const type = result.media_type === 'tv' ? 'tv' : 'movie'
      const cacheKey = `${type}-${result.id}`

      const initialLabel = type === 'tv'
        ? getTvFskLabelFromContentRatings(result.content_ratings?.results)
        : getMovieFskLabelFromReleaseDates(result.release_dates?.results)

      if (initialLabel) {
        fskCacheRef.current.set(cacheKey, initialLabel)
        setResultFskLabel(initialLabel)
        return
      }

      if (fskCacheRef.current.has(cacheKey)) {
        setResultFskLabel(fskCacheRef.current.get(cacheKey))
        return
      }

      setResultFskLabel(null)

      try {
        const fetchedLabel = type === 'tv'
          ? getTvFskLabelFromContentRatings(await getTvContentRatings(result.id))
          : getMovieFskLabelFromReleaseDates(await getMovieReleaseDates(result.id))

        if (!isCancelled) {
          fskCacheRef.current.set(cacheKey, fetchedLabel)
          setResultFskLabel(fetchedLabel)
        }
      } catch {
        if (!isCancelled) {
          fskCacheRef.current.set(cacheKey, null)
          setResultFskLabel(null)
        }
      }
    }

    loadResultFsk()

    return () => {
      isCancelled = true
    }
  }, [result])

  const sortParam = useMemo(() => {
    const option = sortOptions.find((item) => item.value === sortBy) || sortOptions[0]
    return mediaType === 'tv' ? option.sortByTv : option.sortByMovie
  }, [mediaType, sortBy])

  const roll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = { sort_by: sortParam }

      if (sortBy === 'rating') params['vote_count.gte'] = 200
      else params['vote_count.gte'] = 50

      if (sortBy === 'date') {
        const today = new Date().toISOString().split('T')[0]
        if (mediaType === 'movie') params['release_date.lte'] = today
        else params['first_air_date.lte'] = today
      }

      if (selectedGenres.length > 0) params.with_genres = selectedGenres.join(',')
      if (year) {
        if (mediaType === 'movie') params.primary_release_year = year
        else params.first_air_date_year = year
      }
      if (rating) params['vote_average.gte'] = rating
      if (fsk && mediaType === 'movie') setMovieFskFilterParams(params, fsk, fskMode)
      if (selectedProviders.length > 0) params.with_watch_providers = selectedProviders.join('|')

      const discover = mediaType === 'tv' ? discoverTv : discoverMovies

      const first = await discover({ ...params, page: 1 })
      const maxPage = Math.min(first.total_pages, 500)

      if (maxPage === 0 || first.total_results === 0) {
        setError('Keine Ergebnisse für diese Filter.')
        setResult(null)
        setLoading(false)
        return
      }

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const randomPage = Math.floor(Math.random() * maxPage) + 1
        const page = randomPage === 1 && attempt === 0
          ? first
          : await discover({ ...params, page: randomPage })

        const items = page.results.filter((m) => m.poster_path && m.overview)

        if (items.length > 0) {
          const pick = items[Math.floor(Math.random() * items.length)]
          setResult({ ...pick, media_type: mediaType })
          return
        }
      }

      setError('Keine passenden Ergebnisse gefunden. Versuch andere Filter.')
      setResult(null)
    } catch {
      setError('Fehler beim Laden. Bitte versuch es nochmal.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [mediaType, sortBy, sortParam, selectedGenres, year, rating, fsk, fskMode, selectedProviders])

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

  function resetFilters() {
    setSortBy('popularity')
    setSelectedGenres([])
    setYear('')
    setRating('')
    setFsk('')
    setFskMode('lte')
    setSelectedProviders([])
  }

  const title = result?.title || result?.name
  const date = result?.release_date || result?.first_air_date
  const releaseYear = date ? new Date(date).getFullYear() : null
  const linkPath = result ? (result.media_type === 'tv' ? `/tv/${result.id}` : `/movie/${result.id}`) : null

  const hasFilters = selectedGenres.length > 0 || year || rating || fsk || selectedProviders.length > 0 || sortBy !== 'popularity'
  const activeFilterCount =
    selectedGenres.length +
    (year ? 1 : 0) +
    (rating ? 1 : 0) +
    (fsk ? 1 : 0) +
    selectedProviders.length +
    (sortBy !== 'popularity' ? 1 : 0)

  const quickFilters = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
          {[
            { type: 'movie', label: 'Filme' },
            { type: 'tv', label: 'Serien' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => switchMediaType(type)}
              aria-pressed={mediaType === type}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaType === type
                  ? 'bg-accent-500 text-black'
                  : 'text-surface-300 hover:text-surface-100'
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
                  : 'text-surface-300 hover:text-surface-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={roll}
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-accent-500 text-black font-bold text-base hover:bg-accent-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.4)] active:scale-95"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Würfle…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
              </svg>
              Würfeln!
            </>
          )}
        </button>
      </div>

      {genres.data && (
        <div>
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">Genre</p>
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
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">Jahr</p>
          <Select
            value={year}
            onChange={setYear}
            options={[{ value: '', label: 'Alle Jahre' }, ...years.map((itemYear) => ({ value: String(itemYear), label: String(itemYear) }))]}
            placeholder="Alle Jahre"
            ariaLabel="Jahr"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">Bewertung</p>
          <Select
            value={rating}
            onChange={setRating}
            options={ratingOptions}
            placeholder="Alle"
            ariaLabel="Bewertung"
          />
        </div>

        {mediaType === 'movie' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-surface-200 uppercase tracking-wider mb-2">FSK</p>
              <Select
                value={fsk}
                onChange={setFsk}
                options={fskOptions}
                placeholder="Alle"
                ariaLabel="FSK"
              />
            </div>

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
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-surface-100">Zufallsgenerator</h1>
        <p className="text-surface-400 text-sm mt-2">
          Keine Ahnung was du schauen sollst? Lass den Zufall entscheiden.
        </p>
      </div>

      <FilterPanel
        title="Zufalls-Filter"
        quickLabel="Schnellfilter"
        quickContent={quickFilters}
        defaultOpen={hasFilters}
        activeCount={activeFilterCount}
        onReset={hasFilters ? resetFilters : undefined}
      >
        <ProviderFilter
          providers={providers.data}
          selected={selectedProviders}
          onToggle={toggleProvider}
        />
      </FilterPanel>

      {error && <ErrorBox message={error} />}

      {result && !loading && (
        <div className="relative rounded-2xl overflow-hidden bg-surface-900 animate-slide-up">
          {result.backdrop_path && (
            <div className="absolute inset-0">
              <img
                src={backdropUrl(result.backdrop_path)}
                alt=""
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-900/85 to-surface-900/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-surface-900/50" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(var(--vignette-rgb), 0.5) 100%)' }} />
            </div>
          )}

          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 sm:p-8">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <img
                src={posterUrl(result.poster_path)}
                alt={title}
                className="w-48 sm:w-56 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/5"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-surface-100 leading-tight">
                    {title}
                  </h2>
                  <WatchlistButton media={result} size="lg" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-surface-300">
                  {releaseYear && <span>{releaseYear}</span>}
                  <span className="px-2 py-0.5 rounded-md bg-surface-800/80 text-accent-400 text-xs font-medium">
                    {result.media_type === 'tv' ? 'Serie' : 'Film'}
                  </span>
                  {resultFskLabel && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-800/80 text-surface-200 text-xs font-medium">
                      {resultFskLabel}
                    </span>
                  )}
                  {result.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {result.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                {result.overview && (
                  <p className="text-surface-200 leading-relaxed line-clamp-4 sm:line-clamp-6 max-w-2xl">
                    {result.overview}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={roll}
                  className="px-6 py-2.5 rounded-lg bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Nochmal
                </button>
                <Link
                  to={linkPath}
                  className="px-6 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-medium hover:bg-accent-400 transition-colors"
                >
                  Zur Detailseite
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-20">
          <svg className="w-20 h-20 mx-auto text-surface-700 mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
          </svg>
          <p className="text-surface-500 text-lg">Wähle deine Filter und drück auf Würfeln!</p>
        </div>
      )}
    </div>
  )
}

export default Random


