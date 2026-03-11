import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePersonDetails, usePersonCredits } from '../hooks/usePerson'
import { IMAGE_BASE } from '../api/tmdb'
import MediaCard from '../components/common/MediaCard'
import ErrorBox from '../components/common/ErrorBox'

const genderMap = {
  1: 'Weiblich',
  2: 'Männlich',
  3: 'Nicht-binär',
}

const departmentMap = {
  Acting: 'Schauspiel',
  Directing: 'Regie',
  Writing: 'Drehbuch',
  Production: 'Produktion',
  'Sound': 'Ton',
  'Camera': 'Kamera',
  'Art': 'Art Department',
  'Editing': 'Schnitt',
}

function calcAge(birthday, deathday) {
  const end = deathday ? new Date(deathday) : new Date()
  return Math.floor((end - new Date(birthday)) / 31557600000)
}

function PersonDetail() {
  const { id } = useParams()
  const { data: person, isLoading, error } = usePersonDetails(id)
  useDocumentTitle(person?.name)
  const credits = usePersonCredits(id)

  if (isLoading) return <PersonSkeleton />
  if (error) return <ErrorBox message={error.response?.status === 404 ? 'Diese Person wurde nicht gefunden oder existiert nicht mehr.' : 'Person konnte nicht geladen werden. Bitte versuch es später nochmal.'} />
  if (!person) return null

  const age = person.birthday
    ? calcAge(person.birthday, person.deathday)
    : null

  const birthday = person.birthday
    ? new Date(person.birthday).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const deathday = person.deathday
    ? new Date(person.deathday).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const department = departmentMap[person.known_for_department] || person.known_for_department
  const photo = person.profile_path ? `${IMAGE_BASE}/h632${person.profile_path}` : null

  const castCredits = credits.data?.cast || []
  const crewCredits = credits.data?.crew || []

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-10">
        {photo ? (
          <img
            src={photo}
            alt={person.name}
            className="w-40 sm:w-52 md:w-60 aspect-[2/3] rounded-xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/5 flex-shrink-0"
          />
        ) : (
          <div className="w-40 sm:w-52 md:w-60 aspect-[2/3] rounded-xl bg-surface-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 text-surface-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide text-white leading-tight">
            {person.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-300">
            {department && (
              <span className="px-2.5 py-0.5 rounded-full bg-accent-500/15 text-accent-400 text-xs font-medium">
                {department}
              </span>
            )}
            {genderMap[person.gender] && <span>{genderMap[person.gender]}</span>}
            {birthday && (
              <span>
                * {birthday}
                {age != null && !person.deathday && ` (${age} Jahre)`}
              </span>
            )}
            {deathday && <span>† {deathday} ({age} Jahre)</span>}
            {person.place_of_birth && <span>{person.place_of_birth}</span>}
          </div>

          {person.biography && (
            <Biography text={person.biography} />
          )}
        </div>
      </div>

      {/* Filmografie — Schauspiel */}
      {castCredits.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-wide text-white mb-4">
            Bekannt für ({castCredits.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {castCredits.slice(0, 24).map((item, i) => (
              <MediaCard key={`${item.id}-${item.media_type}-${item.credit_id}`} media={item} index={i} animate={i < 12} />
            ))}
          </div>
        </section>
      )}

      {/* Filmografie — Crew */}
      {crewCredits.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-wide text-white mb-4">
            Hinter der Kamera ({crewCredits.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {crewCredits.slice(0, 18).map((item, i) => (
              <MediaCard key={`${item.id}-${item.media_type}-crew-${item.credit_id}`} media={item} index={i} animate={i < 12} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Biography({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 600

  return (
    <div>
      <p className={`text-surface-200 leading-relaxed max-w-3xl ${!expanded && isLong ? 'line-clamp-5' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-accent-400 text-sm mt-1 hover:text-accent-300 transition-colors cursor-pointer"
        >
          {expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
        </button>
      )}
    </div>
  )
}

function PersonSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-10">
        <div className="w-40 sm:w-52 md:w-60 aspect-[2/3] rounded-xl bg-surface-800 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-12 bg-surface-800 rounded-lg w-2/3" />
          <div className="flex gap-3">
            <div className="h-6 bg-surface-800 rounded-full w-24" />
            <div className="h-6 bg-surface-800 rounded-full w-32" />
          </div>
          <div className="space-y-2 max-w-3xl">
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-full" />
            <div className="h-4 bg-surface-800 rounded w-5/6" />
            <div className="h-4 bg-surface-800 rounded w-3/4" />
          </div>
        </div>
      </div>
      <div className="h-8 bg-surface-800 rounded w-48 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-surface-800" />
        ))}
      </div>
    </div>
  )
}

export default PersonDetail
