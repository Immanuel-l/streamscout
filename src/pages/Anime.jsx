import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import MediaCard from '../components/common/MediaCard'
import GridSkeleton from '../components/common/GridSkeleton'
import ErrorBox from '../components/common/ErrorBox'

const animeParams = {
  with_genres: '16',
  with_origin_country: 'JP',
  sort_by: 'popularity.desc',
}

function Anime() {
  useDocumentTitle('Anime')
  const [searchParams, setSearchParams] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => searchParams.get('type') || 'tv')
  const [startPage, setStartPage] = useState(1)

  // Sync state to URL params
  useEffect(() => {
    const params = {}
    if (mediaType !== 'tv') params.type = mediaType
    setSearchParams(params, { replace: true })
  }, [mediaType, setSearchParams])

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['anime', mediaType, startPage],
    queryFn: ({ pageParam }) => {
      const params = { ...animeParams, page: pageParam }
      return mediaType === 'tv' ? discoverTv(params) : discoverMovies(params)
    },
    initialPageParam: startPage,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= Math.min(lastPage.total_pages, 500) ? next : undefined
    },
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
        <div className="flex items-center gap-3">
          <span className="text-4xl">🎌</span>
          <div>
            <h1 className="font-display text-5xl tracking-wide text-white">Anime</h1>
            <p className="text-surface-300 text-sm mt-1.5 max-w-2xl">Japanische Animationsfilme und -serien — von Shōnen-Action bis Studio Ghibli.</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {['Animation', 'Japan', 'Nur im Abo'].map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-300 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {[
            { type: 'tv', label: 'Serien' },
            { type: 'movie', label: 'Filme' },
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
          <p className="text-surface-400 text-lg">Keine Ergebnisse gefunden</p>
        </div>
      )}
    </div>
  )
}

export default Anime
