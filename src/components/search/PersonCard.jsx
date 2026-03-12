import { memo } from 'react'
import { Link } from 'react-router-dom'
import { IMAGE_BASE } from '../../api/tmdb'
import { ANIMATION_DELAY_MODULO, ANIMATION_DELAY_MS } from '../../utils/constants'

const departmentLabels = {
  Acting: 'Schauspiel',
  Directing: 'Regie',
  Writing: 'Drehbuch',
  Production: 'Produktion',
  Sound: 'Ton',
  Camera: 'Kamera',
  Art: 'Art Department',
  Editing: 'Schnitt',
}

function PersonCard({ person, index = 0, animate = true }) {
  const profileUrl = person.profile_path
    ? `${IMAGE_BASE}/w342${person.profile_path}`
    : null
  const dept = departmentLabels[person.known_for_department] || person.known_for_department
  const knownFor = person.known_for?.slice(0, 3) || []

  return (
    <Link
      to={`/person/${person.id}`}
      className={`group relative w-full ${animate ? 'animate-fade-in' : ''}`}
      style={animate ? { animationDelay: `${(index % ANIMATION_DELAY_MODULO) * ANIMATION_DELAY_MS}ms` } : undefined}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-800 transition-shadow duration-500 group-hover:shadow-[0_8px_40px_-8px_rgba(245,158,11,0.15)]">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-500">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}

        {/* Department badge */}
        {dept && (
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-900/80 text-accent-400 backdrop-blur-sm">
            {dept}
          </span>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-3 sm:p-4 pointer-events-none group-hover:pointer-events-auto">
          <h3 className="text-white text-base font-bold leading-tight line-clamp-2 mb-1.5">
            {person.name}
          </h3>
          {dept && (
            <p className="text-accent-400 text-xs font-medium mb-2">{dept}</p>
          )}
          {knownFor.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-surface-400 text-[10px] uppercase tracking-wider">Bekannt für</p>
              {knownFor.map((item) => (
                <p key={item.id} className="text-surface-200 text-xs truncate">
                  {item.title || item.name}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title below card */}
      <div className="mt-2 px-1 group-hover:opacity-0 transition-opacity duration-300">
        <p className="text-surface-200 text-sm font-medium leading-tight line-clamp-1">{person.name}</p>
        {dept && <p className="text-surface-400 text-xs mt-0.5">{dept}</p>}
      </div>
    </Link>
  )
}

export default memo(PersonCard)
