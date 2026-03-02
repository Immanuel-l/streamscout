import { useParams } from 'react-router-dom'
import { useMovieDetails, useMovieProviders, useMovieSimilar } from '../hooks/useMovies'
import { backdropUrl, posterUrl } from '../api/tmdb'
import DetailSkeleton from '../components/detail/DetailSkeleton'
import RatingRing from '../components/detail/RatingRing'
import ProviderList from '../components/detail/ProviderList'
import MediaRow from '../components/common/MediaRow'
import WatchlistButton from '../components/common/WatchlistButton'

function MovieDetail() {
  const { id } = useParams()
  const { data: movie, isLoading, error } = useMovieDetails(id)
  const providers = useMovieProviders(id)
  const genreIds = movie?.genres?.map((g) => g.id)
  const keywordIds = movie?.keywords?.keywords?.map((k) => k.id)
  const similar = useMovieSimilar(id, genreIds, keywordIds)

  if (isLoading) return <DetailSkeleton />
  if (error) return <p className="text-red-400">Film konnte nicht geladen werden. Bitte versuch es später nochmal.</p>
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
        {poster && (
          <div className="hidden md:block flex-shrink-0">
            <img
              src={poster}
              alt={movie.title}
              className="w-56 lg:w-64 rounded-xl shadow-2xl shadow-black/50"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <div className="flex items-start gap-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide text-white leading-tight">
                {movie.title}
              </h1>
              <WatchlistButton
                media={{ id: movie.id, media_type: 'movie', title: movie.title, poster_path: movie.poster_path }}
                size="lg"
              />
            </div>
            {movie.tagline && (
              <p className="text-accent-400 text-sm mt-2 italic">{movie.tagline}</p>
            )}
          </div>

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

          {movie.vote_average > 0 && (
            <div className="flex items-center gap-3">
              <RatingRing rating={movie.vote_average} />
              <span className="text-sm text-surface-400">
                {movie.vote_count?.toLocaleString('de-DE')} Bewertungen
              </span>
            </div>
          )}

          {movie.overview && (
            <p className="text-surface-200 leading-relaxed max-w-3xl">{movie.overview}</p>
          )}

          <div>
            <h2 className="font-display text-2xl tracking-wide text-white mb-3">Wo streamen?</h2>
            {providers.isLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-surface-800 animate-pulse" />
                ))}
              </div>
            ) : providers.error ? (
              <p className="text-surface-500 text-sm">Streaming-Infos konnten nicht geladen werden.</p>
            ) : (
              <ProviderList providers={providers.data} />
            )}
          </div>
        </div>
      </div>

      {(similar.isLoading || similar.data?.length > 0) && (
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
