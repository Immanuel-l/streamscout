import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, Navigate, Link, useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { getMoodBySlug } from '../utils/moods'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'
import ScrollToTop from '../components/common/ScrollToTop'

const sortOptions = [
  { value: 'popularity', label: 'Beliebtheit', sortBy: 'popularity.desc' },
  { value: 'date', label: 'Neueste zuerst', sortByMovie: 'primary_release_date.desc', sortByTv: 'first_air_date.desc' },
  { value: 'rating', label: 'Bewertung', sortBy: 'vote_average.desc' },
]

function Mood() {
  const { slug } = useParams()
  const mood = getMoodBySlug(slug)
  useDocumentTitle(mood?.title)
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'movie')
  const [sortValue, setSortValue] = useState(() => searchParams.get('sort') || 'popularity')
  const [startPage, setStartPage] = useState(1)

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'movie') params.type = mediaType
    if (sortValue !== 'popularity') params.sort = sortValue
    setSearchParams(params, { replace: true })
  }, [mediaType, sortValue, setSearchParams])

  const params = mood?.[mediaType] || {}
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
    queryKey: ['mood', slug, mediaType, sortValue, startPage],
    queryFn: ({ pageParam }) => {
      const discoverParams = { ...params, sort_by: apiSortBy, page: pageParam }
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

  const navigate = useNavigate()

  if (!mood) return <Navigate to="/" replace />

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mood.icon}</span>
          <div>
            <h1 className="font-display text-5xl tracking-wide text-white">{mood.title}</h1>
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

      {/* Controls: Media Type Toggle + Sort + Shuffle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {[
            { type: 'movie', label: 'Filme' },
            { type: 'tv', label: 'Serien' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              aria-pressed={mediaType === type}
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
              onClick={() => setSortValue(value)}
              aria-pressed={sortValue === value}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortValue === value
                  ? 'bg-accent-500 text-black'
                  : 'text-surface-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={shuffle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 text-surface-300 hover:text-white hover:bg-surface-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          Mischen
        </button>
      </div>

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
