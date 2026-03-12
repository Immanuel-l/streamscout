import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { IMAGE_BASE } from '../../api/tmdb'
import ArrowButton from '../common/ArrowButton'

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
            <ArrowButton direction="left" onClick={() => scroll('left')} groupHoverClass="group-hover/cast" />
          </div>
        )}
        {canScrollRight && (
          <div className="hidden sm:block">
            <ArrowButton direction="right" onClick={() => scroll('right')} groupHoverClass="group-hover/cast" />
          </div>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Besetzung — horizontal scrollen"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); scroll('left') }
            if (e.key === 'ArrowRight') { e.preventDefault(); scroll('right') }
          }}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:rounded-xl"
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
