import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchMulti } from '../api/common'
import { useDebounce } from '../hooks/useDebounce'
import SearchBar from '../components/search/SearchBar'
import MediaCard from '../components/common/MediaCard'

function SearchGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
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

function Search() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    select: (data) =>
      data.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv'),
  })

  const hasQuery = debouncedQuery.length >= 2
  const hasResults = data && data.length > 0
  const noResults = hasQuery && !isLoading && !error && !hasResults

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-white mb-6">Suche</h1>
        <SearchBar value={query} onChange={setQuery} suggestions={data?.slice(0, 5) || []} />
      </div>

      {error && (
        <p className="text-red-400 text-sm">Suche fehlgeschlagen. Bitte versuch es später nochmal.</p>
      )}

      {hasQuery && isLoading && <SearchGridSkeleton />}

      {hasResults && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {data.map((media, i) => (
            <MediaCard key={`${media.media_type}-${media.id}`} media={media} index={i} showType />
          ))}
        </div>
      )}

      {noResults && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-surface-400 text-lg">Keine Ergebnisse für „{debouncedQuery}"</p>
          <p className="text-surface-500 text-sm mt-1">Versuch es mit einem anderen Suchbegriff.</p>
        </div>
      )}

      {!hasQuery && !isLoading && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125M19.125 12h1.5m0 0c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m1.5 3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75h-1.5" />
          </svg>
          <p className="text-surface-400 text-lg">Finde Filme und Serien</p>
          <p className="text-surface-500 text-sm mt-1">Gib mindestens 2 Zeichen ein, um zu suchen.</p>
        </div>
      )}
    </div>
  )
}

export default Search
