import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { IMAGE_BASE } from '../../api/tmdb'

function ArrowButton({ direction, onClick }) {
  const isLeft = direction === 'left'
  return (
    <button
      onClick={onClick}
      aria-label={isLeft ? 'Zurück scrollen' : 'Weiter scrollen'}
      className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} z-10 h-full w-12 sm:w-14 flex items-center ${isLeft ? 'justify-start' : 'justify-end'} opacity-0 group-hover/cast:opacity-100 transition-opacity duration-300 cursor-pointer`}
    >
      <span className="w-10 h-10 rounded-full bg-surface-950/80 backdrop-blur-sm border border-surface-700/50 flex items-center justify-center text-surface-100 hover:bg-surface-800 hover:border-surface-600 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          {isLeft ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          )}
        </svg>
      </span>
    </button>
  )
}

function CastList({ cast }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const visible = (cast || []).filter((c) => c.profile_path).slice(0, 20)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  if (visible.length === 0) return null

  function scroll(direction) {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-surface-100 mb-3">Besetzung</h2>
      <div className="group/cast relative">
        {/* Fade edges */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-linear-to-r from-surface-950 to-transparent z-5 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-linear-to-l from-surface-950 to-transparent z-5 pointer-events-none" />
        )}

        {/* Arrow buttons — desktop only */}
        {canScrollLeft && (
          <div className="hidden sm:block">
            <ArrowButton direction="left" onClick={() => scroll('left')} />
          </div>
        )}
        {canScrollRight && (
          <div className="hidden sm:block">
            <ArrowButton direction="right" onClick={() => scroll('right')} />
          </div>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {visible.map((person) => (
            <Link
              key={person.credit_id}
              to={`/person/${person.id}`}
              className="flex-shrink-0 w-24 sm:w-28 group/card"
            >
              <img
                src={`${IMAGE_BASE}/w185${person.profile_path}`}
                alt={person.name}
                className="w-full aspect-[2/3] rounded-lg object-cover ring-1 ring-white/5 group-hover/card:ring-accent-500/50 transition-all duration-300 group-hover/card:scale-105"
                loading="lazy"
              />
              <p className="text-surface-100 text-xs font-medium mt-1.5 truncate">{person.name}</p>
              <p className="text-surface-400 text-xs truncate">{person.character}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CastList
