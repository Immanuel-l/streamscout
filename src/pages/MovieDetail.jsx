import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMovieDetails, useMovieProviders, useMovieSimilar, useNowPlaying } from '../hooks/useMovies'
import { backdropUrl, posterUrl } from '../api/tmdb'
import DetailSkeleton from '../components/detail/DetailSkeleton'
import RatingRing from '../components/detail/RatingRing'
import ProviderList from '../components/detail/ProviderList'
import MediaRow from '../components/common/MediaRow'
import WatchlistButton from '../components/common/WatchlistButton'
import CastList from '../components/detail/CastList'
import TrailerSection from '../components/detail/TrailerSection'
import ErrorBox from '../components/common/ErrorBox'

function MovieDetail() {
  const { id } = useParams()
  const { data: movie, isLoading, error } = useMovieDetails(id)
  useDocumentTitle(movie?.title)
  const providers = useMovieProviders(id)
  const { data: nowPlayingData } = useNowPlaying()
  const nowPlayingIds = nowPlayingData?.ids
  const genreIds = movie?.genres?.map((g) => g.id)
  const keywordIds = movie?.keywords?.keywords?.map((k) => k.id)
  const similar = useMovieSimilar(id, genreIds, keywordIds)

  if (isLoading) return <DetailSkeleton />
  if (error) return <ErrorBox message="Film konnte nicht geladen werden. Bitte versuch es später nochmal." />
  if (!movie) return null

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const hours = Math.floor(movie.runtime / 60)
  const minutes = movie.runtime % 60
  const runtime = movie.runtime ? `${hours}h ${minutes}min` : null
  const backdrop = backdropUrl(movie.backdrop_path)
  const poster = posterUrl(movie.poster_path)

  const isInCinema = nowPlayingIds?.has(Number(id))
  const deRelease = movie.release_dates?.results?.find((r) => r.iso_3166_1 === 'DE')
  const theatricalDate = deRelease?.release_dates?.find((d) => d.type === 3)?.release_date
  const kinostart = theatricalDate
    ? new Date(theatricalDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      {/* Hero — cinematic multi-layer gradient */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div className="relative h-[30vh] sm:h-[45vh] md:h-[55vh]">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="absolute inset-0 bg-surface-800" />
          )}
          {/* Three-layer gradient: bottom fade, left fade, vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/70 via-60% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-950/90 via-surface-950/30 via-50% to-transparent" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.4) 100%)' }} />
        </div>
      </section>

      {/* Content */}
      <div className="relative -mt-20 sm:-mt-40 md:-mt-52 z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10">
        {poster && (
          <div className="flex-shrink-0 self-center sm:self-start">
            <img
              src={poster}
              alt={movie.title}
              onError={(e) => { e.target.style.display = 'none' }}
              className="w-36 sm:w-44 md:w-56 lg:w-64 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/5"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <div className="flex items-start gap-4">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl tracking-wide text-white leading-tight">
                {movie.title}
              </h1>
              <WatchlistButton
                media={{ id: movie.id, media_type: 'movie', title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, release_date: movie.release_date }}
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

          {isInCinema && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <svg className="w-5 h-5 text-accent-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
              </svg>
              <div>
                <p className="text-accent-400 font-semibold text-sm">Aktuell im Kino</p>
                {kinostart && (
                  <p className="text-surface-400 text-xs mt-0.5">Kinostart in Deutschland: {kinostart}</p>
                )}
              </div>
            </div>
          )}

          {!isInCinema && (
            <div>
              <h2 className="font-display text-2xl tracking-wide text-white mb-3">Wo streamen?</h2>
              {providers.isLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-surface-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <ProviderList providers={providers.data} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cast */}
      {movie.credits?.cast?.length > 0 && (
        <div className="mt-14">
          <CastList cast={movie.credits.cast} />
        </div>
      )}

      {/* Trailer */}
      {movie.videos?.results?.length > 0 && (
        <div className="mt-14">
          <TrailerSection videos={movie.videos.results} />
        </div>
      )}

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
