import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { searchMulti, searchMovies, searchTv, searchPerson } from '../api/common'
import { getMovieProviders } from '../api/movies'
import { getTvProviders } from '../api/tv'
import { useDebounce } from '../hooks/useDebounce'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'
import SearchBar from '../components/search/SearchBar'
import MediaCard from '../components/common/MediaCard'
import PersonCard from '../components/search/PersonCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import ScrollToTop from '../components/common/ScrollToTop'

const searchFns = {
  all: searchMulti,
  movie: searchMovies,
  tv: searchTv,
  person: searchPerson,
}

const HISTORY_KEY = 'streamscout-search-history'
const MAX_HISTORY = 10

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  useDocumentTitle(query ? `Suche: ${query}` : 'Suche')
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'all')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'relevance')
  const [onlyStreamable, setOnlyStreamable] = useState(() => searchParams.get('streamable') === 'true')
  const [searchHistory, setSearchHistory] = useState(getSearchHistory)
  const debouncedQuery = useDebounce(query, 300)

  const isPersonSearch = mediaType === 'person'

  // Switch media type and reset irrelevant filters for person search
  function handleMediaType(type) {
    setMediaType(type)
    if (type === 'person') {
      setSortBy('relevance')
      setOnlyStreamable(false)
    }
  }

  // Sync state to URL params (replace to avoid history spam)
  useEffect(() => {
    const params = {}
    if (debouncedQuery) params.q = debouncedQuery
    if (mediaType !== 'all') params.type = mediaType
    if (sortBy !== 'relevance') params.sort = sortBy
    if (onlyStreamable) params.streamable = 'true'
    setSearchParams(params, { replace: true })
  }, [debouncedQuery, mediaType, sortBy, onlyStreamable, setSearchParams])

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', debouncedQuery, mediaType],
    queryFn: ({ pageParam = 1 }) => searchFns[mediaType](debouncedQuery, pageParam),
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= Math.min(lastPage.total_pages, 500) ? next : undefined
    },
    initialPageParam: 1,
    enabled: debouncedQuery.length >= 2,
    retry: 1,
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  // Save to search history when results arrive
  useEffect(() => {
    if (debouncedQuery.length >= 2 && data?.pages[0]?.results.length > 0) {
      const trimmed = debouncedQuery.trim()
      const prev = getSearchHistory()
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      setSearchHistory(next)
    }
  }, [debouncedQuery, data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const firstPageCount = data?.pages[0]?.results.length || 0

  const rawResults = useMemo(() => {
    if (!data) return []
    if (isPersonSearch) {
      return data.pages.flatMap((page) =>
        page.results.filter((r) => r.profile_path)
      )
    }
    return data.pages.flatMap((page) => {
      let results = mediaType === 'all'
        ? page.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        : page.results.map((r) => ({ ...r, media_type: mediaType }))
      return results.filter((r) => r.poster_path && r.overview)
    })
  }, [data, mediaType, isPersonSearch])

  // Suggestions for autocomplete (first 5 from first page)
  const suggestions = useMemo(() => {
    if (!data?.pages[0]) return []
    const page = data.pages[0].results
    if (isPersonSearch) {
      return page
        .filter((r) => r.profile_path)
        .slice(0, 5)
        .map((r) => ({ ...r, media_type: 'person' }))
    }
    const items = mediaType === 'all'
      ? page.filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      : page.map((r) => ({ ...r, media_type: mediaType }))
    return items.slice(0, 5)
  }, [data, mediaType, isPersonSearch])

  // Fetch providers only when streamable filter is active (not for person search)
  const providerQueries = useQueries({
    queries: (isPersonSearch ? [] : rawResults || []).map((media) => ({
      queryKey: [media.media_type, media.id, 'providers'],
      queryFn: () => media.media_type === 'tv' ? getTvProviders(media.id) : getMovieProviders(media.id),
      staleTime: 24 * 60 * 60 * 1000,
      enabled: onlyStreamable,
    })),
  })

  // Progressive provider loading — don't block the whole grid
  const providersChecking = onlyStreamable && !isPersonSearch && rawResults.length > 0 && providerQueries.some((q) => q.isLoading)
  const noProviderResolved = onlyStreamable && !isPersonSearch && rawResults.length > 0 && !providerQueries.some((q) => q.isSuccess || q.isError)

  const results = useMemo(() => {
    if (!rawResults.length) return []
    if (isPersonSearch) return rawResults

    let filtered = [...rawResults]

    // Streamable filter (flatrate only)
    if (onlyStreamable) {
      filtered = filtered.filter((_, i) => {
        const q = providerQueries[i]
        if (!q?.isSuccess) return false
        return q.data?.flatrate?.some((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
      })
    }

    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    } else if (sortBy === 'year') {
      const getDate = (m) => m.release_date || m.first_air_date || ''
      filtered.sort((a, b) => getDate(b).localeCompare(getDate(a)))
    }

    return filtered
  }, [rawResults, sortBy, onlyStreamable, providerQueries, isPersonSearch])

  const sentinelRef = useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage })

  // Search history handlers
  function handleHistorySelect(q) {
    setQuery(q)
  }

  function handleHistoryRemove(q) {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h !== q)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }

  function handleHistoryClear() {
    setSearchHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  const hasQuery = debouncedQuery.length >= 2
  const hasResults = results.length > 0
  const noResults = hasQuery && !isLoading && !error && data && rawResults.length === 0
  const allFilteredOut = hasQuery && !isLoading && rawResults.length > 0 && results.length === 0 && !providersChecking

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-surface-100 mb-6">Suche</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
          history={searchHistory}
          onHistorySelect={handleHistorySelect}
          onHistoryRemove={handleHistoryRemove}
          onHistoryClear={handleHistoryClear}
        />
      </div>

      {/* Filter controls */}
      {hasQuery && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
            {[
              { type: 'all', label: 'Alle' },
              { type: 'movie', label: 'Filme' },
              { type: 'tv', label: 'Serien' },
              { type: 'person', label: 'Personen' },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleMediaType(type)}
                aria-pressed={mediaType === type}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mediaType === type
                    ? 'bg-accent-500 text-black'
                    : 'text-surface-300 hover:text-surface-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!isPersonSearch && (
            <>
              <button
                onClick={() => setOnlyStreamable(!onlyStreamable)}
                aria-pressed={onlyStreamable}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  onlyStreamable
                    ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                    : 'bg-surface-800 text-surface-300 hover:text-surface-100'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                Nur Streambar
              </button>

              <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
                {[
                  { value: 'relevance', label: 'Relevanz' },
                  { value: 'rating', label: 'Bewertung' },
                  { value: 'year', label: 'Jahr' },
                ].map(({ value, label }) => (
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
            </>
          )}

          {results.length > 0 && !isLoading && (
            <span className="text-surface-400 text-sm ml-auto">
              {results.length.toLocaleString('de-DE')}{hasNextPage ? '+' : ''} Ergebnisse
            </span>
          )}
        </div>
      )}

      {error && <ErrorBox message="Suche fehlgeschlagen. Bitte versuch es später nochmal." />}

      {(hasQuery && isLoading) || noProviderResolved ? <GridSkeleton count={12} /> : null}

      {hasResults && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {isPersonSearch
              ? results.map((person, i) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    index={i}
                    animate={i < firstPageCount}
                  />
                ))
              : results.map((media, i) => (
                  <MediaCard
                    key={`${media.media_type}-${media.id}`}
                    media={media}
                    index={i}
                    eager
                    animate={i < firstPageCount}
                  />
                ))
            }

            {/* Sentinel inside grid, before skeletons — prevents oscillation */}
            {hasNextPage && (
              <div ref={sentinelRef} className="col-span-full h-px" />
            )}

            {/* Inline skeleton placeholders while fetching next page */}
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
          {error && rawResults.length > 0 && !isFetchingNextPage && (
            <div className="py-8 max-w-md mx-auto">
              <ErrorBox message="Fehler beim Laden weiterer Ergebnisse." onRetry={() => fetchNextPage()} />
            </div>
          )}

          {providersChecking && (
            <p className="text-surface-500 text-sm text-center py-4 animate-pulse">Provider werden geprüft…</p>
          )}

          {!hasNextPage && results.length > 20 && (
            <p className="text-surface-500 text-sm text-center py-8">Keine weiteren Ergebnisse.</p>
          )}
        </>
      )}

      {noResults && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-surface-400 text-lg">Keine Ergebnisse für &bdquo;{debouncedQuery}&ldquo;</p>
          <p className="text-surface-500 text-sm mt-1">Versuch es mit einem anderen Suchbegriff.</p>
        </div>
      )}

      {allFilteredOut && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <p className="text-surface-400 text-lg">Keine streambare Ergebnisse</p>
          <p className="text-surface-500 text-sm mt-1">Deaktiviere den Filter oder versuch einen anderen Suchbegriff.</p>
        </div>
      )}

      {!hasQuery && !isLoading && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125M19.125 12h1.5m0 0c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m1.5 3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75h-1.5" />
          </svg>
          <p className="text-surface-400 text-lg">Finde Filme, Serien und Personen</p>
          <p className="text-surface-500 text-sm mt-1">Gib mindestens 2 Zeichen ein, um zu suchen.</p>
        </div>
      )}

      <ScrollToTop />
    </div>
  )
}

export default Search
