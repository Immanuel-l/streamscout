import { Link } from 'react-router-dom'
import { posterUrl } from '../../api/tmdb'
import WatchlistButton from './WatchlistButton'

function RatingBadge({ rating }) {
  const score = Math.round(rating * 10)
  const color =
    score >= 70
      ? 'bg-emerald-500/90 text-white'
      : score >= 50
        ? 'bg-amber-500/90 text-white'
        : 'bg-red-500/90 text-white'

  return (
    <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm ${color}`}>
      {score}%
    </span>
  )
}

const typeLabels = { movie: 'Film', tv: 'Serie' }

function MediaCard({ media, index = 0, showType = false }) {
  const title = media.title || media.name
  const date = media.release_date || media.first_air_date
  const year = date ? new Date(date).getFullYear() : null
  const type = media.media_type === 'tv' ? 'tv' : 'movie'
  const linkPath = type === 'tv' ? `/tv/${media.id}` : `/movie/${media.id}`
  const poster = posterUrl(media.poster_path, 'w342')

  return (
    <Link
      to={linkPath}
      className="group relative flex-shrink-0 w-36 sm:w-44 animate-fade-in"
      style={{ animationDelay: `${(index % 20) * 50}ms` }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-800">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-500">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {media.vote_average > 0 && <RatingBadge rating={media.vote_average} />}

        {showType && typeLabels[type] && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-900/80 text-accent-400 backdrop-blur-sm">
            {typeLabels[type]}
          </span>
        )}

        <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <WatchlistButton media={{ ...media, media_type: type }} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <div>
            <p className="text-white text-sm font-medium leading-tight line-clamp-2">{title}</p>
            {year && <p className="text-surface-300 text-xs mt-1">{year}</p>}
          </div>
        </div>
      </div>

      <div className="mt-2 px-1 group-hover:opacity-0 transition-opacity duration-300">
        <p className="text-surface-200 text-sm font-medium leading-tight line-clamp-1">{title}</p>
        {year && <p className="text-surface-400 text-xs mt-0.5">{year}</p>}
      </div>
    </Link>
  )
}

export default MediaCard
