import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'
import { getMoodBySlug } from '../utils/moods'
import MediaCard from '../components/common/MediaCard'

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

function Mood() {
  const { slug } = useParams()
  const mood = getMoodBySlug(slug)
  const [mediaType, setMediaType] = useState('movie')

  const params = mood?.[mediaType] || {}

  const { data, isLoading, error } = useQuery({
    queryKey: ['mood', slug, mediaType],
    queryFn: () => {
      const discoverParams = { ...params, sort_by: 'popularity.desc' }
      return mediaType === 'tv' ? discoverTv(discoverParams) : discoverMovies(discoverParams)
    },
    enabled: !!mood,
    select: (data) =>
      data.results
        .filter((m) => m.poster_path && m.overview)
        .map((m) => ({ ...m, media_type: mediaType })),
  })

  if (!mood) return <Navigate to="/" replace />

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
          <span className="text-4xl">{mood.icon}</span>
          <div>
            <h1 className="font-display text-5xl tracking-wide text-white">{mood.title}</h1>
            <p className="text-surface-400 text-sm mt-1">{mood.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Media Type Toggle */}
      <div className="flex gap-1 bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { type: 'movie', label: 'Filme' },
          { type: 'tv', label: 'Serien' },
        ].map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setMediaType(type)}
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

      {/* Results */}
      {error && (
        <p className="text-red-400 text-sm">Fehler beim Laden: {error.message}</p>
      )}

      {isLoading ? (
        <ResultSkeleton />
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {data.map((media, i) => (
            <MediaCard key={media.id} media={media} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-surface-500 text-center py-20">Keine Ergebnisse gefunden.</p>
      )}
    </div>
  )
}

export default Mood
