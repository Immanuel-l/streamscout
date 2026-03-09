import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { posterUrl, backdropUrl, IMAGE_BASE } from '../api/tmdb'
import { useGenres, useWatchProviders } from '../hooks/useProviders'
import WatchlistButton from '../components/common/WatchlistButton'
import ErrorBox from '../components/common/ErrorBox'
import Select from '../components/common/Select'

const ratingOptions = [
  { value: '', label: 'Egal' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
]

const languageOptions = [
  { value: 'de|en', label: 'Deutsch & Englisch' },
  { value: 'de', label: 'Nur Deutsch' },
  { value: 'en', label: 'Nur Englisch' },
  { value: '', label: 'Alle Sprachen' },
]

const eraOptions = [
  { value: '', label: 'Egal' },
  { value: '2020', label: 'Ab 2020' },
  { value: '2010', label: 'Ab 2010' },
  { value: '2000', label: 'Ab 2000' },
  { value: '1990', label: 'Ab 1990' },
]

const MAX_RETRIES = 3

function Random() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [genre, setGenre] = useState(() => searchParams.get('genre') || '')
  const [rating, setRating] = useState(() => searchParams.get('rating') || '')
  const [language, setLanguage] = useState(() => searchParams.get('lang') || 'de|en')
  const [era, setEra] = useState(() => searchParams.get('era') || '')
  const [selectedProviders, setSelectedProviders] = useState(() => {
    const p = searchParams.get('providers')
    return p ? p.split(',').map(Number).filter(Boolean) : []
  })

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (genre) params.genre = genre
    if (rating) params.rating = rating
    if (language !== 'de|en') params.lang = language
    if (era) params.era = era
    if (selectedProviders.length > 0) params.providers = selectedProviders.join(',')
    setSearchParams(params, { replace: true })
  }, [mediaType, genre, rating, language, era, selectedProviders, setSearchParams])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const genres = useGenres(mediaType)
  const providers = useWatchProviders(mediaType)

  const roll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = { sort_by: 'popularity.desc', 'vote_count.gte': 50 }
      if (genre) params.with_genres = genre
      if (rating) params['vote_average.gte'] = rating

      // Language filter — single language goes to API, combined filters client-side
      const langCodes = language ? language.split('|') : []
      if (langCodes.length === 1) params.with_original_language = langCodes[0]

      // Era filter
      if (era) {
        if (mediaType === 'movie') params['primary_release_date.gte'] = `${era}-01-01`
        else params['first_air_date.gte'] = `${era}-01-01`
      }

      // Provider filter
      if (selectedProviders.length > 0) {
        params.with_watch_providers = selectedProviders.join('|')
      }

      const discover = mediaType === 'tv' ? discoverTv : discoverMovies

      // First request: get total_pages
      const first = await discover({ ...params, page: 1 })
      const maxPage = Math.min(first.total_pages, 500)

      if (maxPage === 0 || first.total_results === 0) {
        setError('Keine Ergebnisse für diese Filter.')
        setResult(null)
        setLoading(false)
        return
      }

      // Retry loop — pick random page, filter results, retry if nothing usable
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const randomPage = Math.floor(Math.random() * maxPage) + 1
        const page = randomPage === 1 && attempt === 0
          ? first
          : await discover({ ...params, page: randomPage })

        let items = page.results.filter((m) => m.poster_path && m.overview)

        // Client-side language filter for combined "de|en"
        if (langCodes.length > 1) {
          items = items.filter((m) => langCodes.includes(m.original_language))
        }

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
  }, [mediaType, genre, rating, language, era, selectedProviders])

  function switchMediaType(type) {
    setMediaType(type)
    setGenre('')
    setSelectedProviders([])
  }

  function toggleProvider(id) {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const title = result?.title || result?.name
  const date = result?.release_date || result?.first_air_date
  const year = date ? new Date(date).getFullYear() : null
  const linkPath = result ? (result.media_type === 'tv' ? `/tv/${result.id}` : `/movie/${result.id}`) : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-white">Zufallsgenerator</h1>
        <p className="text-surface-400 text-sm mt-2">
          Keine Ahnung was du schauen sollst? Lass den Zufall entscheiden.
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {/* Media Type Toggle */}
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
          {[
            { type: 'movie', label: 'Film' },
            { type: 'tv', label: 'Serie' },
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

        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Genre</p>
            <Select
              value={genre}
              onChange={setGenre}
              options={[{ value: '', label: 'Alle Genres' }, ...(genres.data?.map((g) => ({ value: String(g.id), label: g.name })) || [])]}
              placeholder="Alle Genres"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Mindestbewertung</p>
            <Select
              value={rating}
              onChange={setRating}
              options={ratingOptions}
              placeholder="Egal"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Sprache</p>
            <Select
              value={language}
              onChange={setLanguage}
              options={languageOptions}
              placeholder="Alle Sprachen"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Zeitraum</p>
            <Select
              value={era}
              onChange={setEra}
              options={eraOptions}
              placeholder="Egal"
            />
          </div>
        </div>

        {/* Provider Logos */}
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

        {/* Roll Button */}
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

      {/* Error */}
      {error && <ErrorBox message={error} />}

      {/* Result */}
      {result && !loading && (
        <div className="relative rounded-2xl overflow-hidden bg-surface-900 animate-slide-up">
          {/* Backdrop */}
          {result.backdrop_path && (
            <div className="absolute inset-0">
              <img
                src={backdropUrl(result.backdrop_path)}
                alt=""
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-900/85 to-surface-900/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-surface-900/50" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(10,10,10,0.5) 100%)' }} />
            </div>
          )}

          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 sm:p-8">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <img
                src={posterUrl(result.poster_path)}
                alt={title}
                className="w-48 sm:w-56 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/5"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-white leading-tight">
                    {title}
                  </h2>
                  <WatchlistButton media={result} size="lg" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-surface-300">
                  {year && <span>{year}</span>}
                  <span className="px-2 py-0.5 rounded-md bg-surface-800/80 text-accent-400 text-xs font-medium">
                    {result.media_type === 'tv' ? 'Serie' : 'Film'}
                  </span>
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

              {/* Action Buttons */}
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

      {/* Initial empty state */}
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
