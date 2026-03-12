import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { posterUrl, IMAGE_BASE } from '../../api/tmdb'
import { t } from '../../utils/i18n'

const typeLabelKeys = { movie: 'media.movie', tv: 'media.tv', person: 'media.person' }

function SearchBar({ value, onChange, suggestions = [], history = [], onHistorySelect, onHistoryRemove, onHistoryClear }) {
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const focusedRef = useRef(true)
  const [focused, setFocused] = useState(true)
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setHistoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Open suggestions dropdown when suggestions arrive — only if input is focused
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (focusedRef.current) {
      const hasSuggestions = suggestions.length > 0
      setOpen(hasSuggestions)
      if (hasSuggestions) setHistoryOpen(false)
    }
    setHighlighted(-1)
  }, [suggestions])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleValueChange(newValue) {
    onChange(newValue)
    if (!newValue && focusedRef.current && history.length > 0) {
      setHistoryOpen(true)
      setOpen(false)
      setHighlighted(-1)
    } else if (newValue) {
      setHistoryOpen(false)
    }
  }

  function goTo(item) {
    const path = item.media_type === 'person'
      ? `/person/${item.id}`
      : item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
    setOpen(false)
    navigate(path)
  }

  function handleHistoryClick(query) {
    setHistoryOpen(false)
    setHighlighted(-1)
    onHistorySelect?.(query)
  }

  function handleKeyDown(e) {
    // Handle history keyboard navigation
    if (historyOpen && history.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlighted((prev) => (prev + 1) % history.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlighted((prev) => (prev <= 0 ? history.length - 1 : prev - 1))
          break
        case 'Enter':
          if (highlighted >= 0) {
            e.preventDefault()
            handleHistoryClick(history[highlighted])
          }
          break
        case 'Escape':
          setHistoryOpen(false)
          setHighlighted(-1)
          break
      }
      return
    }

    if (!open || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((prev) => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
        break
      case 'Enter':
        if (highlighted >= 0) {
          e.preventDefault()
          goTo(suggestions[highlighted])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlighted(-1)
        break
    }
  }

  function imgForItem(item) {
    if (item.media_type === 'person') {
      return item.profile_path ? `${IMAGE_BASE}/w185${item.profile_path}` : null
    }
    return posterUrl(item.poster_path, 'w185')
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
        onChange={(e) => handleValueChange(e.target.value)}
        onFocus={() => {
          focusedRef.current = true
          setFocused(true)
          if (!value && history.length > 0) {
            setHistoryOpen(true)
          } else if (suggestions.length > 0) {
            setOpen(true)
          }
        }}
        onBlur={() => { focusedRef.current = false; setFocused(false) }}
        onKeyDown={handleKeyDown}
        placeholder={t('search.placeholder')}
        role="combobox"
        aria-expanded={(open && suggestions.length > 0) || historyOpen}
        aria-autocomplete="list"
        className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder-surface-400 text-lg focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 shadow-none focus:shadow-[0_0_30px_-6px_rgba(245,158,11,0.12)] transition-all duration-300"
      />
      {value && (
        <button
          onClick={() => {
            handleValueChange('')
            focusedRef.current = true
            inputRef.current?.focus()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-100 transition-colors z-10"
          aria-label={t('search.clear')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {!value && !focused && (
        <kbd className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 text-xs bg-surface-700/50 border border-surface-600/30 px-1.5 py-0.5 rounded font-mono pointer-events-none">
          /
        </kbd>
      )}

      {/* Autocomplete Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-surface-800/95 backdrop-blur-lg border border-surface-700/60 shadow-2xl shadow-black/60 overflow-hidden z-50"
          role="listbox"
        >
          {suggestions.map((item, index) => {
            const title = item.title || item.name
            const date = item.release_date || item.first_air_date
            const year = date ? new Date(date).getFullYear() : null
            const img = imgForItem(item)

            return (
              <button
                key={`${item.media_type}-${item.id}`}
                onClick={() => goTo(item)}
                onMouseEnter={() => setHighlighted(index)}
                role="option"
                aria-selected={index === highlighted}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                  index === highlighted ? 'bg-surface-700/60' : ''
                }`}
              >
                {img ? (
                  <img
                    src={img}
                    alt={title}
                    className={`${item.media_type === 'person' ? 'w-10 h-10 rounded-full' : 'w-10 h-14 rounded-md'} object-cover flex-shrink-0`}
                  />
                ) : (
                  <div className={`${item.media_type === 'person' ? 'w-10 h-10 rounded-full' : 'w-10 h-14 rounded-md'} bg-surface-700 flex-shrink-0`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-surface-100 text-sm font-medium truncate">{title}</p>
                  <p className="text-surface-400 text-xs">
                    {t(typeLabelKeys[item.media_type] || '')}{year ? ` · ${year}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Search History Dropdown */}
      {historyOpen && history.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-surface-800/95 backdrop-blur-lg border border-surface-700/60 shadow-2xl shadow-black/60 overflow-hidden z-50">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-surface-700/40">
            <span className="text-surface-400 text-xs uppercase tracking-wider font-medium">{t('search.history.title')}</span>
            <button
              onClick={() => { onHistoryClear?.(); setHistoryOpen(false) }}
              className="text-surface-500 text-xs hover:text-surface-300 transition-colors"
            >
              {t('search.history.clear')}
            </button>
          </div>
          {history.map((q, index) => (
            <div
              key={q}
              onMouseEnter={() => setHighlighted(index)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors ${
                index === highlighted ? 'bg-surface-700/60' : ''
              }`}
            >
              <svg className="w-4 h-4 text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <button
                onClick={() => handleHistoryClick(q)}
                className="flex-1 text-left text-surface-200 text-sm truncate hover:text-surface-100 transition-colors"
              >
                {q}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onHistoryRemove?.(q) }}
                className="text-surface-600 hover:text-surface-300 flex-shrink-0 transition-colors p-2"
                aria-label={`"${q}" aus Verlauf entfernen`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
