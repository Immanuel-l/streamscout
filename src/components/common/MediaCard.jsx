import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { posterUrl, IMAGE_BASE } from '../../api/tmdb'
import { getMovieProviders } from '../../api/movies'
import { getTvProviders } from '../../api/tv'
import { ALLOWED_PROVIDER_SET } from '../../utils/providers'
import { useNowPlaying } from '../../hooks/useMovies'
import WatchlistButton from './WatchlistButton'

const typeLabels = { movie: 'Film', tv: 'Serie' }

function MediaCard({ media, index = 0, eager = false, animate = true, hideWatchlistButton = false }) {
  const [hovered, setHovered] = useState(false)
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

  const title = media.title || media.name
  const date = media.release_date || media.first_air_date
  const year = date ? new Date(date).getFullYear() : null
  const type = media.media_type === 'tv' ? 'tv' : 'movie'
  const linkPath = type === 'tv' ? `/tv/${media.id}` : `/movie/${media.id}`
  const poster = posterUrl(media.poster_path, 'w342')
  const score = media.vote_average > 0 ? Math.round(media.vote_average * 10) : null
  const scoreColor =
    score >= 70
      ? 'bg-emerald-500/90 text-white'
      : score >= 50
        ? 'bg-amber-500/90 text-white'
        : 'bg-red-500/90 text-white'

  // "Im Kino" — based on TMDB now_playing endpoint via cached React Query
  const { data: nowPlayingData } = useNowPlaying()
  const isInCinema = type === 'movie' && nowPlayingData?.ids?.has(media.id)

  // Fetch providers on hover (lazy to reduce API load)
  const { data: providerData, isSuccess: providersLoaded, isError: providersErrored } = useQuery({
    queryKey: [type, media.id, 'providers'],
    queryFn: () => (type === 'tv' ? getTvProviders(media.id) : getMovieProviders(media.id)),
    enabled: hovered || isTouch,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const providers =
    providerData?.flatrate
      ?.filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
      ?.slice(0, 5) || []

  const hasAnyProvider = providerData && ['flatrate', 'rent', 'buy'].some(
    (key) => providerData[key]?.some((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
  )
  const notStreamable = hovered && (providersLoaded || providersErrored) && !hasAnyProvider && !isInCinema

  return (
    <Link
      to={linkPath}
      className={`group relative w-full ${animate ? 'animate-fade-in' : ''}`}
      style={animate ? { animationDelay: `${(index % 20) * 50}ms` } : undefined}
      onMouseEnter={() => setHovered(true)}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-800 transition-shadow duration-500 group-hover:shadow-[0_8px_40px_-8px_rgba(245,158,11,0.15)]">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading={eager ? "eager" : "lazy"}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-500">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Rating badge — visible by default, hides on hover. Shifts down when an overlay button occupies top-right */}
        {score && (
          <span
            className={`absolute ${hideWatchlistButton || (isTouch && !hideWatchlistButton) ? 'top-12' : 'top-2'} right-2 z-10 text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0 ${scoreColor}`}
          >
            {score}%
          </span>
        )}

        {/* Type badge — shows "Im Kino" for current theatrical releases */}
        {isInCinema ? (
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-500/90 text-black backdrop-blur-sm flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
            </svg>
            Im Kino
          </span>
        ) : typeLabels[type] ? (
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-900/80 text-accent-400 backdrop-blur-sm">
            {typeLabels[type]}
          </span>
        ) : null}

        {/* Mobile Provider Logos (Permanent, Bottom Right, Only on touch devices) */}
        {isTouch && providers.length > 0 && (
          <div className="absolute bottom-2 right-2 z-10 flex gap-1 bg-surface-900/80 p-1 rounded backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0">
            {providers.slice(0, 2).map((p) => (
              <img
                key={p.provider_id}
                src={`${IMAGE_BASE}/w45${p.logo_path}`}
                alt={p.provider_name}
                className="w-5 h-5 rounded-sm object-cover"
              />
            ))}
          </div>
        )}

        {/* Mobile Watchlist Button (Permanent, Top Right, Only on touch devices) */}
        {isTouch && !hideWatchlistButton && (
          <div className="absolute top-2 right-2 z-20">
            <WatchlistButton media={{ ...media, media_type: type }} size="sm" />
          </div>
        )}

        {/* Hover Overlay — cinematic spotlight (desktop only) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-3 sm:p-4 pointer-events-none group-hover:pointer-events-auto">
          {/* Top: Watchlist button (if not hidden, desktop only) */}
          <div className="flex justify-end">
            {!hideWatchlistButton && !isTouch && (
              <WatchlistButton media={{ ...media, media_type: type }} size="lg" />
            )}
          </div>

          {/* Bottom: Title, meta, providers */}
          <div className="space-y-1.5">
            <h3 className="text-white text-base font-bold leading-tight line-clamp-2">
              {title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-surface-200">
              {year && <span className="font-medium">{year}</span>}
              {score && (
                <>
                  <span className="text-surface-500">·</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded ${scoreColor}`}>{score}%</span>
                </>
              )}
            </div>

            {/* Provider logos */}
            {providers.length > 0 ? (
              <div className="flex gap-1.5 pt-1">
                {providers.map((p) => (
                  <img
                    key={p.provider_id}
                    src={`${IMAGE_BASE}/w45${p.logo_path}`}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="w-7 h-7 rounded-md object-cover ring-1 ring-white/20"
                  />
                ))}
              </div>
            ) : notStreamable ? (
              <p className="text-surface-400 text-xs pt-1">Nicht streambar</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Title below card — fades out on hover */}
      <div className="mt-2 px-1 group-hover:opacity-0 transition-opacity duration-300">
        <p className="text-surface-200 text-sm font-medium leading-tight line-clamp-1">{title}</p>
        {year && <p className="text-surface-400 text-xs mt-0.5">{year}</p>}
        {notStreamable && (
          <p className="text-surface-500 text-[11px] mt-0.5">Nicht streambar</p>
        )}
      </div>
    </Link>
  )
}

export default memo(MediaCard)
