import { useParams } from 'react-router-dom'
import { useMovieDetails, useMovieProviders, useMovieSimilar } from '../hooks/useMovies'
import { backdropUrl, posterUrl } from '../api/tmdb'
import ProviderList from '../components/detail/ProviderList'
import MediaRow from '../components/common/MediaRow'

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 h-[50vh] bg-surface-800" />
      <div className="mt-8 space-y-4 max-w-3xl">
        <div className="h-10 bg-surface-800 rounded w-2/3" />
        <div className="h-5 bg-surface-800 rounded w-1/3" />
        <div className="h-24 bg-surface-800 rounded w-full" />
      </div>
    </div>
  )
}

function RatingRing({ rating }) {
  const score = Math.round(rating * 10)
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 70 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" className="stroke-surface-700" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          className={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {score}<span className="text-[9px] text-surface-300">%</span>
      </span>
    </div>
  )
}

function MovieDetail() {
  const { id } = useParams()
  const { data: movie, isLoading, error } = useMovieDetails(id)
  const providers = useMovieProviders(id)
  const similar = useMovieSimilar(id)

  if (isLoading) return <DetailSkeleton />
  if (error) return <p className="text-red-400">Fehler: {error.message}</p>
  if (!movie) return null

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const hours = Math.floor(movie.runtime / 60)
  const minutes = movie.runtime % 60
  const runtime = movie.runtime ? `${hours}h ${minutes}min` : null
  const backdrop = backdropUrl(movie.backdrop_path)
  const poster = posterUrl(movie.poster_path)

  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div className="relative h-[30vh] sm:h-[45vh] md:h-[55vh]">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-950/80 to-transparent" />
        </div>
      </section>

      {/* Content */}
      <div className="relative -mt-32 sm:-mt-40 md:-mt-52 z-10 flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Poster */}
        {poster && (
          <div className="hidden md:block flex-shrink-0">
            <img
              src={poster}
              alt={movie.title}
              className="w-56 lg:w-64 rounded-xl shadow-2xl shadow-black/50"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide text-white leading-tight">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-accent-400 text-sm mt-2 italic">{movie.tagline}</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-300">
            {year && <span>{year}</span>}
            {runtime && <span>{runtime}</span>}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-200 text-xs">
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-3">
              <RatingRing rating={movie.vote_average} />
              <span className="text-sm text-surface-400">
                {movie.vote_count?.toLocaleString('de-DE')} Bewertungen
              </span>
            </div>
          )}

          {/* Description */}
          {movie.overview && (
            <p className="text-surface-200 leading-relaxed max-w-3xl">{movie.overview}</p>
          )}

          {/* Providers */}
          <div>
            <h2 className="font-display text-2xl tracking-wide text-white mb-3">Wo streamen?</h2>
            <ProviderList providers={providers.data} />
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.data?.length > 0 && (
        <div className="mt-14">
          <MediaRow
            title="Ähnliche Filme"
            items={similar.data}
            isLoading={similar.isLoading}
            error={similar.error}
          />
        </div>
      )}
    </div>
  )
}

export default MovieDetail
