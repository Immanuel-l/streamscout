import { Link } from 'react-router-dom'
import { IMAGE_BASE } from '../../api/tmdb'

function CastList({ cast }) {
  if (!cast || cast.length === 0) return null

  const visible = cast.filter((c) => c.profile_path).slice(0, 20)
  if (visible.length === 0) return null

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-white mb-3">Besetzung</h2>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {visible.map((person) => (
            <Link
              key={person.credit_id}
              to={`/person/${person.id}`}
              className="flex-shrink-0 w-24 sm:w-28 group"
            >
              <img
                src={`${IMAGE_BASE}/w185${person.profile_path}`}
                alt={person.name}
                className="w-full aspect-[2/3] rounded-lg object-cover ring-1 ring-white/5 group-hover:ring-accent-500/50 transition-all duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <p className="text-white text-xs font-medium mt-1.5 truncate">{person.name}</p>
              <p className="text-surface-400 text-xs truncate">{person.character}</p>
            </Link>
          ))}
        </div>
        <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-surface-950 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default CastList
