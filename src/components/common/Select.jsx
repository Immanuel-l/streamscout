import { useState, useRef, useEffect } from 'react'

function Select({ value, onChange, options, placeholder = 'Auswählen', ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef(null)
  const listRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))
  const selectedIndex = options.findIndex((o) => String(o.value) === String(value))

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function openDropdown() {
    setOpen(true)
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0)
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (open && highlighted >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[highlighted]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted, open])

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) {
          openDropdown()
        } else {
          setHighlighted((prev) => (prev + 1) % options.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) {
          openDropdown()
        } else {
          setHighlighted((prev) => (prev <= 0 ? options.length - 1 : prev - 1))
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && highlighted >= 0) {
          onChange(String(options[highlighted].value))
          setOpen(false)
        } else {
          openDropdown()
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setHighlighted(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setHighlighted(options.length - 1)
        }
        break
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel || placeholder}
        className={`flex items-center justify-between gap-2 min-w-[140px] bg-surface-800 border text-sm rounded-lg px-3 py-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 ${
          open
            ? 'border-accent-500/60 shadow-[0_0_12px_-4px_rgba(245,158,11,0.15)]'
            : 'border-surface-700 hover:border-surface-600'
        }`}
      >
        <span className={selected?.value ? 'text-surface-100' : 'text-surface-200'}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-surface-200 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full min-w-[160px] rounded-xl bg-surface-800/95 backdrop-blur-lg border border-surface-700/60 shadow-2xl shadow-black/60 overflow-hidden"
          role="listbox"
          ref={listRef}
        >
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-hide">
            {options.map((option, index) => (
              <button
                key={option.value}
                role="option"
                aria-selected={String(option.value) === String(value)}
                onClick={() => { onChange(String(option.value)); setOpen(false) }}
                onMouseEnter={() => setHighlighted(index)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  String(option.value) === String(value)
                    ? 'text-accent-400 bg-accent-400/10'
                    : index === highlighted
                      ? 'text-surface-100 bg-surface-700/60'
                      : 'text-surface-200 hover:bg-surface-700/60 hover:text-surface-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Select




