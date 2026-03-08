import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { posterUrl } from '../../api/tmdb'

const typeLabels = { movie: 'Film', tv: 'Serie' }

function SearchBar({ value, onChange, suggestions = [] }) {
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Open dropdown when suggestions arrive
  useEffect(() => {
    setOpen(suggestions.length > 0)
  }, [suggestions])

  function goTo(item) {
    const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none z-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Film oder Serie suchen..."
        className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-800/80 border border-surface-700 text-white placeholder-surface-400 text-lg focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all duration-300"
        style={{ boxShadow: 'none' }}
        onFocusCapture={(e) => { e.target.style.boxShadow = '0 0 30px -6px rgba(245, 158, 11, 0.12)' }}
        onBlurCapture={(e) => { e.target.style.boxShadow = 'none' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors z-10"
          aria-label="Suche leeren"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Autocomplete Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-surface-800/95 backdrop-blur-lg border border-surface-700/60 shadow-2xl shadow-black/60 overflow-hidden z-50">
          {suggestions.map((item) => {
            const title = item.title || item.name
            const date = item.release_date || item.first_air_date
            const year = date ? new Date(date).getFullYear() : null
            const poster = posterUrl(item.poster_path, 'w185')

            return (
              <button
                key={`${item.media_type}-${item.id}`}
                onClick={() => goTo(item)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-700/60 transition-colors"
              >
                {poster ? (
                  <img
                    src={poster}
                    alt={title}
                    className="w-10 h-14 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-md bg-surface-700 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{title}</p>
                  <p className="text-surface-400 text-xs">
                    {typeLabels[item.media_type] || ''}{year ? ` · ${year}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchBar
