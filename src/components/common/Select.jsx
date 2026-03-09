import { useState, useRef, useEffect } from 'react'

function Select({ value, onChange, options, placeholder = 'Auswählen' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 min-w-[140px] bg-surface-800 border text-sm rounded-lg px-3 py-2 transition-colors text-left ${
          open
            ? 'border-accent-500/60 shadow-[0_0_12px_-4px_rgba(245,158,11,0.15)]'
            : 'border-surface-700 hover:border-surface-600'
        }`}
      >
        <span className={selected?.value ? 'text-white' : 'text-surface-400'}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[160px] rounded-xl bg-surface-800/95 backdrop-blur-lg border border-surface-700/60 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => { onChange(String(option.value)); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  String(option.value) === String(value)
                    ? 'text-accent-400 bg-accent-400/10'
                    : 'text-surface-200 hover:bg-surface-700/60 hover:text-white'
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
