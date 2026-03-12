import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import MediaCard from './MediaCard'
import ArrowButton from './ArrowButton'
import ErrorBox from './ErrorBox'

function MediaRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="shrink-0 w-40 sm:w-48 md:w-52">
          <div className="aspect-2/3 rounded-xl bg-surface-800 animate-pulse" />
          <div className="mt-2 px-1 space-y-1.5">
            <div className="h-4 bg-surface-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-surface-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MediaRow({ title, items, isLoading, error, linkTo, sortOptions, sortBy, onSortChange }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

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
  }, [checkScroll, items])

  function scroll(direction) {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-surface-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{title}</h2>
        {sortOptions && (
          <div className="flex gap-1 bg-surface-800 rounded-lg p-0.5">
            {sortOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onSortChange(value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortBy === value
                    ? 'bg-accent-500 text-black'
                    : 'text-surface-300 hover:text-surface-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {linkTo && (
          <Link to={linkTo} className="text-sm text-surface-400 hover:text-accent-400 transition-colors whitespace-nowrap ml-auto">
            Alle anzeigen
          </Link>
        )}
      </div>

      {error && <ErrorBox message="Inhalte konnten nicht geladen werden. Bitte versuch es später nochmal." />}

      {isLoading ? (
        <MediaRowSkeleton />
      ) : !items?.length ? (
        <p className="text-surface-500 text-sm">Keine Inhalte verfügbar.</p>
      ) : (
        <div className="group/row relative">
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
            tabIndex={0}
            role="region"
            aria-label={`${title} — horizontal scrollen`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') { e.preventDefault(); scroll('left') }
              if (e.key === 'ArrowRight') { e.preventDefault(); scroll('right') }
            }}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:rounded-xl"
          >
            {items?.map((media, i) => (
              <div key={media.id} className="shrink-0 w-40 sm:w-48 md:w-52">
                <MediaCard media={media} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default MediaRow
